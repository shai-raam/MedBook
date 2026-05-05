const { query, getClient } = require('../config/db');
const { calculateQueuePosition } = require('../services/schedulingService');
const { predictNoShow, recordNoShow } = require('../services/noShowService');
const { suggestFollowUp } = require('../services/followUpService');

const createAppointment = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { doctorId, appointmentDate, startTime, endTime, symptoms, urgency = 'low', isFollowUp = false, parentAppointmentId } = req.body;

    const patientResult = await client.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
    if (patientResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    const patientId = patientResult.rows[0].id;

    const conflictResult = await client.query(
      `SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = $3 AND status NOT IN ('cancelled')`,
      [doctorId, appointmentDate, startTime]
    );
    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Slot already booked.' });
    }

    const noShowPrediction = await predictNoShow(patientId, appointmentDate, startTime);
    const queuePosition = await calculateQueuePosition(doctorId, appointmentDate);

    const appointmentResult = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, status, urgency, symptoms, queue_position, is_follow_up, parent_appointment_id, no_show_predicted, no_show_probability)
       VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [patientId, doctorId, appointmentDate, startTime, endTime, urgency, symptoms, queuePosition, isFollowUp, parentAppointmentId || null, noShowPrediction.isHighRisk, noShowPrediction.probability]
    );

    await client.query('UPDATE patients SET total_appointments = total_appointments + 1 WHERE id = $1', [patientId]);
    await client.query('COMMIT');

    res.status(201).json({ success: true, message: 'Appointment booked. Complete payment to confirm.', data: { appointment: appointmentResult.rows[0], queuePosition } });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let pi = 1;

    if (req.user.role === 'patient') {
      const pr = await query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      conditions.push(`a.patient_id = $${pi++}`);
      params.push(pr.rows[0].id);
    } else if (req.user.role === 'doctor') {
      const dr = await query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      conditions.push(`a.doctor_id = $${pi++}`);
      params.push(dr.rows[0].id);
    }

    if (status) { conditions.push(`a.status = $${pi++}`); params.push(status); }
    if (date) { conditions.push(`a.appointment_date = $${pi++}`); params.push(date); }

    let sql = `SELECT a.*, d_u.first_name as doctor_first_name, d_u.last_name as doctor_last_name, doc.specialization, doc.department, doc.consultation_fee, p_u.first_name as patient_first_name, p_u.last_name as patient_last_name
      FROM appointments a JOIN doctors doc ON a.doctor_id=doc.id JOIN users d_u ON doc.user_id=d_u.id JOIN patients pat ON a.patient_id=pat.id JOIN users p_u ON pat.user_id=p_u.id`;
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ` ORDER BY a.appointment_date DESC, a.start_time ASC LIMIT $${pi++} OFFSET $${pi++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    let countSql = 'SELECT COUNT(*) FROM appointments a';
    if (conditions.length > 0) countSql += ' WHERE ' + conditions.join(' AND ');
    const countResult = await query(countSql, params.slice(0, -2));

    res.json({ success: true, data: { appointments: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult.rows[0].count), totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit) } } });
  } catch (error) { next(error); }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, d_u.first_name as doctor_first_name, d_u.last_name as doctor_last_name, doc.specialization, doc.department, doc.consultation_fee, p_u.first_name as patient_first_name, p_u.last_name as patient_last_name
       FROM appointments a JOIN doctors doc ON a.doctor_id=doc.id JOIN users d_u ON doc.user_id=d_u.id JOIN patients pat ON a.patient_id=pat.id JOIN users p_u ON pat.user_id=p_u.id WHERE a.id=$1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, notes, diagnosis } = req.body;
    const current = await query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found.' });

    const sets = ['status = $1']; const params = [status]; let pi = 2;
    if (notes) { sets.push(`notes = $${pi++}`); params.push(notes); }
    if (diagnosis) { sets.push(`diagnosis = $${pi++}`); params.push(diagnosis); }
    if (status === 'in_progress') sets.push('actual_start_time = NOW()');
    if (status === 'completed') sets.push('actual_end_time = NOW()');
    params.push(req.params.id);
    await query(`UPDATE appointments SET ${sets.join(', ')} WHERE id = $${pi}`, params);

    if (status === 'no_show') await recordNoShow(current.rows[0].patient_id);

    let followUpSuggestion = null;
    if (status === 'completed' && diagnosis) {
      followUpSuggestion = suggestFollowUp(diagnosis);
      if (followUpSuggestion.recommended) {
        await query('UPDATE appointments SET follow_up_date=$1 WHERE id=$2', [followUpSuggestion.suggestedDate, req.params.id]);
      }
    }
    res.json({ success: true, message: `Status updated to ${status}`, data: { followUpSuggestion } });
  } catch (error) { next(error); }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await query(
      `UPDATE appointments SET status='cancelled', cancellation_reason=$1, cancelled_at=NOW() WHERE id=$2 AND status IN ('pending','confirmed') RETURNING *`,
      [reason || 'Cancelled by user', req.params.id]);
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Cannot cancel.' });
    res.json({ success: true, message: 'Cancelled.', data: result.rows[0] });
  } catch (error) { next(error); }
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, startTime, endTime } = req.body;
    const current = await query('SELECT * FROM appointments WHERE id=$1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found.' });
    const conflict = await query(`SELECT id FROM appointments WHERE doctor_id=$1 AND appointment_date=$2 AND start_time=$3 AND status NOT IN ('cancelled') AND id!=$4`,
      [current.rows[0].doctor_id, appointmentDate, startTime, req.params.id]);
    if (conflict.rows.length > 0) return res.status(409).json({ success: false, message: 'Slot not available.' });
    const result = await query(`UPDATE appointments SET appointment_date=$1, start_time=$2, end_time=$3, status='pending' WHERE id=$4 RETURNING *`,
      [appointmentDate, startTime, endTime, req.params.id]);
    res.json({ success: true, message: 'Rescheduled.', data: result.rows[0] });
  } catch (error) { next(error); }
};

const getQueue = async (req, res, next) => {
  try {
    const { doctorId, date } = req.params;
    const result = await query(
      `SELECT a.id, a.start_time, a.end_time, a.status, a.queue_position, a.estimated_wait_time, a.urgency, p_u.first_name as patient_first_name, p_u.last_name as patient_last_name
       FROM appointments a JOIN patients pat ON a.patient_id=pat.id JOIN users p_u ON pat.user_id=p_u.id
       WHERE a.doctor_id=$1 AND a.appointment_date=$2 AND a.status NOT IN ('cancelled','no_show')
       ORDER BY a.queue_position, a.start_time`, [doctorId, date]);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

module.exports = { createAppointment, getAppointments, getAppointmentById, updateAppointmentStatus, cancelAppointment, rescheduleAppointment, getQueue };
