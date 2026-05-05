const express = require('express');
const { getAvailability, setAvailability, deleteAvailability } = require('../controllers/availabilityController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(auth, authorize('doctor'));

router.get('/', getAvailability);
router.post('/', setAvailability);
router.delete('/:id', deleteAvailability);

module.exports = router;
