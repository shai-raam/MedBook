const express = require('express');
const { triageAnalysis, listSymptoms } = require('../controllers/triageController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/symptoms', listSymptoms);
router.post('/analyze', auth, triageAnalysis);

module.exports = router;
