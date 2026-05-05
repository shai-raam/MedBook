const { analyzeSymptoms, getAllSymptoms } = require('../services/triageService');

const triageAnalysis = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of symptoms.' });
    }
    const result = await analyzeSymptoms(symptoms);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const listSymptoms = async (req, res, next) => {
  try {
    const symptoms = await getAllSymptoms();
    res.json({ success: true, data: symptoms });
  } catch (error) { next(error); }
};

module.exports = { triageAnalysis, listSymptoms };
