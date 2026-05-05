const express = require('express');
const { createPrescription, getPrescriptionsByPatient, getPrescriptionById } = require('../controllers/prescriptionController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.post('/', authorize('doctor'), createPrescription);
router.get('/my', authorize('patient'), getPrescriptionsByPatient);
router.get('/patient/:patientId', authorize('doctor', 'admin'), getPrescriptionsByPatient);
router.get('/:id', getPrescriptionById);

module.exports = router;
