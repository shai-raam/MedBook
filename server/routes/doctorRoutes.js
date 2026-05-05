const express = require('express');
const { getAllDoctors, getDoctorById, getDoctorSlots, getDoctorsBySpecialization, getSpecializations, updateDoctorProfile } = require('../controllers/doctorController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllDoctors);
router.get('/specializations', getSpecializations);
router.get('/specialization/:specialization', getDoctorsBySpecialization);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);
router.put('/profile', auth, authorize('doctor'), updateDoctorProfile);

module.exports = router;
