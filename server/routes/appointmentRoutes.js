const express = require('express');
const { body } = require('express-validator');
const { createAppointment, getAppointments, getAppointmentById, updateAppointmentStatus, cancelAppointment, rescheduleAppointment, getQueue } = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(auth);

router.post('/', authorize('patient'), [
  body('doctorId').isString().isLength({ min: 36, max: 36 }).withMessage('Valid doctor ID required'),
  body('appointmentDate').isString().notEmpty().withMessage('Valid date required'),
  body('startTime').isString().notEmpty().withMessage('Valid start time required'),
  body('endTime').isString().notEmpty().withMessage('Valid end time required'),
], validate, createAppointment);

router.get('/', getAppointments);
router.get('/:id', getAppointmentById);

router.put('/:id/status', authorize('doctor', 'admin'), [
  body('status').isIn(['confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
], validate, updateAppointmentStatus);

router.put('/:id/cancel', authorize('patient', 'admin'), cancelAppointment);
router.put('/:id/reschedule', authorize('patient', 'admin'), rescheduleAppointment);
router.get('/queue/:doctorId/:date', getQueue);

module.exports = router;
