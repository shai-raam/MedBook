const { query } = require('../config/db');

const createPrescription = async (req, res, next) => {
  try {
    const { appointmentId, diagnosis, medications, testsRecommended, advice, followUpRequired, followUpDays } = req.body;
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id=$1', [req.user.id]);
    if (doctorResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    const appt = await query('SELECT patient_id FROM appointments WHERE id=$1 AND doctor_id=$2', [appointmentId, doctorResult.rows[0].id]);
    if (appt.rows.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    const result = await query(
      `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, diagnosis, medications, tests_recommended, advice, follow_up_required, follow_up_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [appointmentId, doctorResult.rows[0].id, appt.rows[0].patient_id, diagnosis, JSON.stringify(medications || []), JSON.stringify(testsRecommended || []), advice, followUpRequired || false, followUpDays]);

    if (followUpRequired && followUpDays) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + followUpDays);
      await query('UPDATE appointments SET follow_up_date=$1, diagnosis=$2 WHERE id=$3',
        [followUpDate.toISOString().split('T')[0], diagnosis, appointmentId]);
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

const getPrescriptionsByPatient = async (req, res, next) => {
  try {
    let patientId;
    if (req.user.role === 'patient') {
      const pr = await query('SELECT id FROM patients WHERE user_id=$1', [req.user.id]);
      patientId = pr.rows[0].id;
    } else {
      patientId = req.params.patientId;
    }
    const result = await query(
      `SELECT p.*, d_u.first_name as doctor_first_name, d_u.last_name as doctor_last_name, doc.specialization, a.appointment_date
       FROM prescriptions p JOIN doctors doc ON p.doctor_id=doc.id JOIN users d_u ON doc.user_id=d_u.id JOIN appointments a ON p.appointment_id=a.id
       WHERE p.patient_id=$1 ORDER BY p.created_at DESC`, [patientId]);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

const getPrescriptionById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, d_u.first_name as doctor_first_name, d_u.last_name as doctor_last_name, doc.specialization,
        p_u.first_name as patient_first_name, p_u.last_name as patient_last_name, a.appointment_date
       FROM prescriptions p JOIN doctors doc ON p.doctor_id=doc.id JOIN users d_u ON doc.user_id=d_u.id
       JOIN patients pat ON p.patient_id=pat.id JOIN users p_u ON pat.user_id=p_u.id
       JOIN appointments a ON p.appointment_id=a.id WHERE p.id=$1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

module.exports = { createPrescription, getPrescriptionsByPatient, getPrescriptionById };
