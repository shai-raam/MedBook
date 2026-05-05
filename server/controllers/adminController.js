const { query } = require('../config/db');
const { getDoctorWorkloadStats } = require('../services/workloadService');

const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = []; const params = []; let pi = 1;

    if (role) { conditions.push(`role = $${pi++}`); params.push(role); }
    if (search) { conditions.push(`(first_name ILIKE $${pi} OR last_name ILIKE $${pi} OR email ILIKE $${pi})`); params.push(`%${search}%`); pi++; }

    let sql = `SELECT id, email, role, first_name, last_name, phone, is_active, created_at, last_login FROM users`;
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ` ORDER BY created_at DESC LIMIT $${pi++} OFFSET $${pi++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    const countResult = await query(`SELECT COUNT(*) FROM users${conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''}`, params.slice(0, -2));

    res.json({ success: true, data: { users: result.rows, pagination: { page: parseInt(page), total: parseInt(countResult.rows[0].count) } } });
  } catch (error) { next(error); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const result = await query('UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, email, is_active', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `User ${result.rows[0].is_active ? 'activated' : 'deactivated'}.`, data: result.rows[0] });
  } catch (error) { next(error); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const [usersCount, appointmentsStats, revenueStats, workload] = await Promise.all([
      query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`),
      query(`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`),
      query(`SELECT payment_status, COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM payments GROUP BY payment_status`),
      getDoctorWorkloadStats(new Date().toISOString().split('T')[0]),
    ]);

    const totalRevenue = await query(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE payment_status='completed'`);
    const todayAppointments = await query(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date=CURRENT_DATE`);
    const monthlyRevenue = await query(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE payment_status='completed' AND payment_date >= date_trunc('month', CURRENT_DATE)`);

    res.json({ success: true, data: {
      users: usersCount.rows,
      appointments: appointmentsStats.rows,
      revenue: revenueStats.rows,
      totalRevenue: totalRevenue.rows[0].total,
      monthlyRevenue: monthlyRevenue.rows[0].total,
      todayAppointments: todayAppointments.rows[0].count,
      doctorWorkload: workload,
    }});
  } catch (error) { next(error); }
};

const getEmergencyBookings = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, p_u.first_name as patient_name, p_u.last_name as patient_last, d_u.first_name as doctor_name, doc.specialization
       FROM appointments a JOIN patients pat ON a.patient_id=pat.id JOIN users p_u ON pat.user_id=p_u.id
       JOIN doctors doc ON a.doctor_id=doc.id JOIN users d_u ON doc.user_id=d_u.id
       WHERE a.urgency='emergency' AND a.status IN ('pending','confirmed')
       ORDER BY a.created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

const approveEmergency = async (req, res, next) => {
  try {
    const result = await query(`UPDATE appointments SET status='confirmed', notes='Emergency approved by admin' WHERE id=$1 AND urgency='emergency' RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, message: 'Emergency booking approved.', data: result.rows[0] });
  } catch (error) { next(error); }
};

module.exports = { getAllUsers, toggleUserStatus, getAnalytics, getEmergencyBookings, approveEmergency };
