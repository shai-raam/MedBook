const express = require('express');
const { createOrder, verifyPayment, getPaymentHistory, refundPayment } = require('../controllers/paymentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.post('/create-order', authorize('patient'), createOrder);
router.post('/verify', authorize('patient'), verifyPayment);
router.get('/history', getPaymentHistory);
router.post('/:id/refund', authorize('admin'), refundPayment);

module.exports = router;
