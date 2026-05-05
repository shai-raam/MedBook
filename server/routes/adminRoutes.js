const express = require('express');
const { getAllUsers, toggleUserStatus, getAnalytics, getEmergencyBookings, approveEmergency } = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(auth, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/analytics', getAnalytics);
router.get('/emergency', getEmergencyBookings);
router.put('/emergency/:id/approve', approveEmergency);

module.exports = router;
