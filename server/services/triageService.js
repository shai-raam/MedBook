const { query } = require('../config/db');

/**
 * Smart Triage Service
 * Analyzes patient symptoms and recommends appropriate doctors/specializations
 */

const analyzeSymptoms = async (symptomNames) => {
  if (!symptomNames || symptomNames.length === 0) {
    return { specializations: [], urgency: 'low', doctors: [] };
  }

  // Fetch matching symptoms from database
  const placeholders = symptomNames.map((_, i) => `$${i + 1}`).join(', ');
  const symptomsResult = await query(
    `SELECT name, category, severity_weight, suggested_specializations 
     FROM symptoms WHERE LOWER(name) IN (${placeholders})`,
    symptomNames.map((s) => s.toLowerCase())
  );

  const matchedSymptoms = symptomsResult.rows;

  // Calculate overall severity
  let totalWeight = 0;
  const specializationScores = {};

  matchedSymptoms.forEach((symptom) => {
    totalWeight += parseFloat(symptom.severity_weight);
    symptom.suggested_specializations.forEach((spec) => {
      specializationScores[spec] = (specializationScores[spec] || 0) + parseFloat(symptom.severity_weight);
    });
  });

  // Determine urgency level
  const avgWeight = matchedSymptoms.length > 0 ? totalWeight / matchedSymptoms.length : 0;
  let urgency = 'low';
  if (avgWeight >= 1.3) urgency = 'emergency';
  else if (avgWeight >= 1.0) urgency = 'high';
  else if (avgWeight >= 0.7) urgency = 'medium';

  // Rank specializations by score
  const rankedSpecs = Object.entries(specializationScores)
    .sort(([, a], [, b]) => b - a)
    .map(([spec, score]) => ({ specialization: spec, score: Math.round(score * 100) / 100 }));

  // Find recommended doctors
  const topSpecs = rankedSpecs.slice(0, 3).map((s) => s.specialization);
  let recommendedDoctors = [];

  if (topSpecs.length > 0) {
    const specPlaceholders = topSpecs.map((_, i) => `$${i + 1}`).join(', ');
    const doctorsResult = await query(
      `SELECT d.id, d.specialization, d.consultation_fee, d.rating, d.experience_years,
              d.avg_consultation_time, d.max_patients_per_day, d.department,
              u.first_name, u.last_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.specialization IN (${specPlaceholders})
       AND d.is_available = true AND u.is_active = true
       ORDER BY d.rating DESC, d.experience_years DESC`,
      topSpecs
    );
    recommendedDoctors = doctorsResult.rows;
  }

  return {
    matchedSymptoms: matchedSymptoms.map((s) => s.name),
    unmatchedSymptoms: symptomNames.filter(
      (s) => !matchedSymptoms.find((m) => m.name.toLowerCase() === s.toLowerCase())
    ),
    specializations: rankedSpecs,
    urgency,
    severityScore: Math.round(avgWeight * 100) / 100,
    recommendedDoctors,
  };
};

const getAllSymptoms = async () => {
  const result = await query('SELECT id, name, category FROM symptoms ORDER BY category, name');
  return result.rows;
};

module.exports = { analyzeSymptoms, getAllSymptoms };
