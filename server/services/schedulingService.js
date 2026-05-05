const { query } = require('../config/db');

/**
 * Dynamic Scheduling Service
 * Handles slot generation, delay propagation, and workload balancing
 */

const getDayOfWeek = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

/**
 * Generate available time slots for a doctor on a specific date
 */
const getAvailableSlots = async (doctorId, date) => {
  const dayOfWeek = getDayOfWeek(date);

  // Get doctor's availability for this day
  const availResult = await query(
    `SELECT start_time, end_time, slot_duration
     FROM availability
     WHERE doctor_id = $1 AND day_of_week = $2 AND is_active = true`,
    [doctorId, dayOfWeek]
  );

  if (availResult.rows.length === 0) {
    return [];
  }

  // Get existing appointments for this date
  const appointmentsResult = await query(
    `SELECT start_time, end_time, status
     FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2
     AND status NOT IN ('cancelled')`,
    [doctorId, date]
  );

  const bookedSlots = appointmentsResult.rows;

  // Generate all possible slots
  const allSlots = [];
  for (const avail of availResult.rows) {
    const startMinutes = timeToMinutes(avail.start_time);
    const endMinutes = timeToMinutes(avail.end_time);
    const duration = avail.slot_duration;

    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      const slotStart = minutesToTime(m);
      const slotEnd = minutesToTime(m + duration);

      const isBooked = bookedSlots.some(
        (b) => timeToMinutes(b.start_time) === m
      );

      allSlots.push({
        start_time: slotStart,
        end_time: slotEnd,
        duration,
        is_available: !isBooked,
        status: isBooked ? 'booked' : 'available',
      });
    }
  }

  return allSlots;
};

/**
 * Recommend the best slot for a patient based on doctor workload
 */
const recommendSlot = async (doctorId, date) => {
  const slots = await getAvailableSlots(doctorId, date);
  const availableSlots = slots.filter((s) => s.is_available);

  if (availableSlots.length === 0) return null;

  // Get appointment count for each hour block to find least busy time
  const appointmentsResult = await query(
    `SELECT start_time, COUNT(*) as count
     FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2
     AND status NOT IN ('cancelled')
     GROUP BY start_time`,
    [doctorId, date]
  );

  // Prefer slots in the middle of the day (less likely to have delays)
  // and in less crowded time blocks
  const scored = availableSlots.map((slot) => {
    const minutes = timeToMinutes(slot.start_time);
    // Prefer mid-morning (10-11 AM) slots
    const idealMinutes = 10 * 60 + 30;
    const timePenalty = Math.abs(minutes - idealMinutes) / 60;
    return { ...slot, score: 100 - timePenalty };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
};

/**
 * Handle delay propagation - when a doctor runs late, update queue
 */
const propagateDelay = async (doctorId, date, delayMinutes) => {
  // Get all future appointments for this doctor today
  const result = await query(
    `SELECT id, start_time, end_time, queue_position
     FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2
     AND status IN ('confirmed', 'pending')
     AND start_time > NOW()::TIME
     ORDER BY start_time`,
    [doctorId, date]
  );

  const updates = [];
  for (const appt of result.rows) {
    const estimatedWait = delayMinutes;
    updates.push(
      query(
        `UPDATE appointments SET estimated_wait_time = $1, updated_at = NOW() WHERE id = $2`,
        [estimatedWait, appt.id]
      )
    );
  }

  await Promise.all(updates);
  return result.rows.length;
};

/**
 * Calculate queue position for new appointment
 */
const calculateQueuePosition = async (doctorId, date) => {
  const result = await query(
    `SELECT COUNT(*) as count
     FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2
     AND status NOT IN ('cancelled', 'no_show')`,
    [doctorId, date]
  );
  return parseInt(result.rows[0].count) + 1;
};

// Helper functions
function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = {
  getAvailableSlots,
  recommendSlot,
  propagateDelay,
  calculateQueuePosition,
  getDayOfWeek,
};
