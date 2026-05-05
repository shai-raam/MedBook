const { query } = require('../config/db');

/**
 * Auto Follow-Up Suggestion Service
 * Suggests follow-up appointments based on diagnosis and prescription
 */

// Follow-up rules based on common conditions
const FOLLOW_UP_RULES = {
  'hypertension': { days: 14, reason: 'Blood pressure monitoring' },
  'diabetes': { days: 30, reason: 'Blood sugar level review' },
  'infection': { days: 7, reason: 'Infection resolution check' },
  'surgery': { days: 14, reason: 'Post-operative check' },
  'fracture': { days: 21, reason: 'Healing progress assessment' },
  'dermatitis': { days: 14, reason: 'Skin condition follow-up' },
  'migraine': { days: 30, reason: 'Medication efficacy review' },
  'anxiety': { days: 14, reason: 'Mental health check-in' },
  'allergy': { days: 7, reason: 'Allergy management review' },
  'asthma': { days: 30, reason: 'Respiratory function review' },
};

/**
 * Suggest follow-up based on diagnosis
 */
const suggestFollowUp = (diagnosis) => {
  if (!diagnosis) return null;

  const lowerDiagnosis = diagnosis.toLowerCase();

  for (const [condition, rule] of Object.entries(FOLLOW_UP_RULES)) {
    if (lowerDiagnosis.includes(condition)) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + rule.days);

      return {
        recommended: true,
        daysFromNow: rule.days,
        suggestedDate: followUpDate.toISOString().split('T')[0],
        reason: rule.reason,
        condition: condition,
      };
    }
  }

  return {
    recommended: false,
    reason: 'No automatic follow-up rule matched. Doctor can set custom follow-up.',
  };
};

/**
 * Get pending follow-ups for a patient
 */
const getPendingFollowUps = async (patientId) => {
  const result = await query(
    `SELECT a.id, a.appointment_date, a.follow_up_date, a.diagnosis,
            d.specialization, u.first_name as doctor_first_name, u.last_name as doctor_last_name
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE a.patient_id = $1
       AND a.follow_up_date IS NOT NULL
       AND a.follow_up_date >= CURRENT_DATE
       AND NOT EXISTS (
         SELECT 1 FROM appointments fa
         WHERE fa.parent_appointment_id = a.id
         AND fa.status NOT IN ('cancelled')
       )
     ORDER BY a.follow_up_date`,
    [patientId]
  );

  return result.rows;
};

module.exports = { suggestFollowUp, getPendingFollowUps };
