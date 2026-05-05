const { query } = require('../config/db');

/**
 * Doctor Workload Balancing Service
 * Distributes appointments evenly across doctors in the same specialization
 */

/**
 * Find the least loaded doctor for a given specialization on a date
 */
const findLeastLoadedDoctor = async (specialization, date) => {
  const result = await query(
    `SELECT 
       d.id as doctor_id,
       d.max_patients_per_day,
       d.consultation_fee,
       d.rating,
       d.experience_years,
       u.first_name,
       u.last_name,
       COUNT(a.id) as current_appointments,
       d.max_patients_per_day - COUNT(a.id) as available_capacity
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     LEFT JOIN appointments a ON d.id = a.doctor_id 
       AND a.appointment_date = $2 
       AND a.status NOT IN ('cancelled', 'no_show')
     WHERE d.specialization = $1
       AND d.is_available = true
       AND u.is_active = true
     GROUP BY d.id, u.first_name, u.last_name
     HAVING d.max_patients_per_day - COUNT(a.id) > 0
     ORDER BY available_capacity DESC, d.rating DESC`,
    [specialization, date]
  );

  return result.rows;
};

/**
 * Get workload statistics for all doctors
 */
const getDoctorWorkloadStats = async (date) => {
  const result = await query(
    `SELECT 
       d.id,
       d.specialization,
       d.department,
       d.max_patients_per_day,
       u.first_name,
       u.last_name,
       COUNT(a.id) FILTER (WHERE a.status NOT IN ('cancelled', 'no_show')) as booked_count,
       COUNT(a.id) FILTER (WHERE a.status = 'completed') as completed_count,
       COUNT(a.id) FILTER (WHERE a.status = 'no_show') as no_show_count,
       ROUND(
         COUNT(a.id) FILTER (WHERE a.status NOT IN ('cancelled', 'no_show'))::DECIMAL / 
         NULLIF(d.max_patients_per_day, 0) * 100, 1
       ) as utilization_percent
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     LEFT JOIN appointments a ON d.id = a.doctor_id AND a.appointment_date = $1
     GROUP BY d.id, u.first_name, u.last_name
     ORDER BY utilization_percent DESC NULLS LAST`,
    [date]
  );

  return result.rows;
};

module.exports = { findLeastLoadedDoctor, getDoctorWorkloadStats };
