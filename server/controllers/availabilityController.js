const { query } = require('../config/db');

const getAvailability = async (req, res, next) => {
  try {
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    const result = await query('SELECT * FROM availability WHERE doctor_id = $1 ORDER BY day_of_week, start_time', [doctorResult.rows[0].id]);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

const setAvailability = async (req, res, next) => {
  try {
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    const doctorId = doctorResult.rows[0].id;
    const { dayOfWeek, startTime, endTime, slotDuration = 15 } = req.body;

    const result = await query(
      `INSERT INTO availability (doctor_id, day_of_week, start_time, end_time, slot_duration)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (doctor_id, day_of_week, start_time) 
       DO UPDATE SET end_time = $4, slot_duration = $5, is_active = true
       RETURNING *`,
      [doctorId, dayOfWeek, startTime, endTime, slotDuration]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

const deleteAvailability = async (req, res, next) => {
  try {
    await query('UPDATE availability SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Availability removed.' });
  } catch (error) { next(error); }
};

module.exports = { getAvailability, setAvailability, deleteAvailability };
