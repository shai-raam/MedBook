const { query } = require('../config/db');

/**
 * No-Show Prediction Service
 * Predicts likelihood of a patient not showing up based on historical data
 */

/**
 * Calculate no-show probability for a patient
 * Factors: historical no-show rate, day of week, time of day, gap since booking
 */
const predictNoShow = async (patientId, appointmentDate, startTime) => {
  // Get patient's historical no-show data
  const historyResult = await query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'no_show') as no_shows,
       COUNT(*) as total_appointments,
       p.no_show_count
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     WHERE a.patient_id = $1 AND a.status IN ('completed', 'no_show', 'cancelled')
     GROUP BY p.no_show_count`,
    [patientId]
  );

  let noShowRate = 0;
  let historicalWeight = 0.5;

  if (historyResult.rows.length > 0) {
    const { no_shows, total_appointments } = historyResult.rows[0];
    const total = parseInt(total_appointments);
    if (total > 0) {
      noShowRate = parseInt(no_shows) / total;
      // More history = more confidence
      historicalWeight = Math.min(0.8, 0.3 + total * 0.05);
    }
  }

  // Day of week factor (weekends have higher no-show rates)
  const dayOfWeek = new Date(appointmentDate).getDay();
  const dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.15 : 0;

  // Time of day factor (early morning and late afternoon = higher no-show)
  const hour = parseInt(startTime.split(':')[0]);
  let timeFactor = 0;
  if (hour < 9 || hour > 16) timeFactor = 0.1;

  // Calculate final probability
  const probability = Math.min(
    0.95,
    noShowRate * historicalWeight + dayFactor + timeFactor
  );

  return {
    probability: Math.round(probability * 10000) / 10000,
    isHighRisk: probability > 0.3,
    factors: {
      historicalRate: Math.round(noShowRate * 100) / 100,
      dayOfWeekRisk: dayFactor > 0 ? 'high' : 'low',
      timeOfDayRisk: timeFactor > 0 ? 'moderate' : 'low',
    },
  };
};

/**
 * Update no-show count when appointment is marked as no-show
 */
const recordNoShow = async (patientId) => {
  await query(
    `UPDATE patients SET no_show_count = no_show_count + 1 WHERE id = $1`,
    [patientId]
  );
};

module.exports = { predictNoShow, recordNoShow };
