const { query } = require('../config/db');
const { getAvailableSlots, recommendSlot } = require('../services/schedulingService');
const { findLeastLoadedDoctor } = require('../services/workloadService');

const getAllDoctors = async (req, res, next) => {
  try {
    const { specialization, department, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = ['u.is_active = true', 'd.is_available = true'];
    const params = [];
    let pi = 1;

    if (specialization) { conditions.push(`d.specialization = $${pi++}`); params.push(specialization); }
    if (department) { conditions.push(`d.department = $${pi++}`); params.push(department); }
    if (search) { conditions.push(`(u.first_name ILIKE $${pi} OR u.last_name ILIKE $${pi} OR d.specialization ILIKE $${pi})`); params.push(`%${search}%`); pi++; }

    const sql = `SELECT d.id, d.specialization, d.qualification, d.experience_years, d.consultation_fee, d.bio, d.rating, d.total_ratings, d.department, d.avg_consultation_time, u.first_name, u.last_name, u.avatar_url
      FROM doctors d JOIN users u ON d.user_id = u.id WHERE ${conditions.join(' AND ')}
      ORDER BY d.rating DESC LIMIT $${pi++} OFFSET $${pi++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    const countResult = await query(`SELECT COUNT(*) FROM doctors d JOIN users u ON d.user_id=u.id WHERE ${conditions.join(' AND ')}`, params.slice(0, -2));

    res.json({ success: true, data: { doctors: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult.rows[0].count) } } });
  } catch (error) { next(error); }
};

const getDoctorById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url
       FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

const getDoctorSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });
    const slots = await getAvailableSlots(req.params.id, date);
    const recommended = await recommendSlot(req.params.id, date);
    res.json({ success: true, data: { slots, recommendedSlot: recommended } });
  } catch (error) { next(error); }
};

const getDoctorsBySpecialization = async (req, res, next) => {
  try {
    const { date } = req.query;
    const doctors = await findLeastLoadedDoctor(req.params.specialization, date || new Date().toISOString().split('T')[0]);
    res.json({ success: true, data: doctors });
  } catch (error) { next(error); }
};

const getSpecializations = async (req, res, next) => {
  try {
    const result = await query('SELECT DISTINCT specialization FROM doctors WHERE is_available = true ORDER BY specialization');
    res.json({ success: true, data: result.rows.map(r => r.specialization) });
  } catch (error) { next(error); }
};

const updateDoctorProfile = async (req, res, next) => {
  try {
    const { bio, consultationFee, maxPatientsPerDay, avgConsultationTime } = req.body;
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    await query(
      `UPDATE doctors SET bio=COALESCE($1,bio), consultation_fee=COALESCE($2,consultation_fee), max_patients_per_day=COALESCE($3,max_patients_per_day), avg_consultation_time=COALESCE($4,avg_consultation_time) WHERE id=$5`,
      [bio, consultationFee, maxPatientsPerDay, avgConsultationTime, doctorResult.rows[0].id]);
    res.json({ success: true, message: 'Profile updated.' });
  } catch (error) { next(error); }
};

module.exports = { getAllDoctors, getDoctorById, getDoctorSlots, getDoctorsBySpecialization, getSpecializations, updateDoctorProfile };
