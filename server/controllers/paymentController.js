const crypto = require('crypto');
const { query } = require('../config/db');
const razorpay = require('../config/razorpay');

const createOrder = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    const apptResult = await query(
      `SELECT a.id, a.patient_id, doc.consultation_fee
       FROM appointments a JOIN doctors doc ON a.doctor_id = doc.id WHERE a.id = $1`, [appointmentId]);
    if (apptResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    const amount = Math.round(apptResult.rows[0].consultation_fee * 100); // paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: appointmentId,
      notes: { appointmentId },
    });

    await query(
      `INSERT INTO payments (appointment_id, patient_id, amount, razorpay_order_id, payment_status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [appointmentId, apptResult.rows[0].patient_id, apptResult.rows[0].consultation_fee, order.id]);

    res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID } });
  } catch (error) { 
    if (error.statusCode === 401) {
      error.statusCode = 502; // Change to Bad Gateway to avoid logging out the user on frontend
      error.message = 'Payment gateway authentication failed. Please check Razorpay keys.';
    }
    next(error); 
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await query(`UPDATE payments SET payment_status='failed', failure_reason='Signature mismatch' WHERE razorpay_order_id=$1`, [razorpay_order_id]);
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    const result = await query(
      `UPDATE payments SET payment_status='completed', razorpay_payment_id=$1, razorpay_signature=$2, transaction_id=$1, payment_date=NOW()
       WHERE razorpay_order_id=$3 RETURNING appointment_id`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]);

    if (result.rows.length > 0) {
      await query(`UPDATE appointments SET status='confirmed' WHERE id=$1`, [result.rows[0].appointment_id]);
    }

    res.json({ success: true, message: 'Payment verified and appointment confirmed.' });
  } catch (error) { next(error); }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    let sql, params;
    if (req.user.role === 'patient') {
      const pr = await query('SELECT id FROM patients WHERE user_id=$1', [req.user.id]);
      sql = `SELECT p.*, a.appointment_date, a.start_time, d_u.first_name as doctor_name, doc.specialization
        FROM payments p JOIN appointments a ON p.appointment_id=a.id JOIN doctors doc ON a.doctor_id=doc.id JOIN users d_u ON doc.user_id=d_u.id
        WHERE p.patient_id=$1 ORDER BY p.created_at DESC`;
      params = [pr.rows[0].id];
    } else {
      sql = `SELECT p.*, a.appointment_date, p_u.first_name as patient_name, d_u.first_name as doctor_name
        FROM payments p JOIN appointments a ON p.appointment_id=a.id JOIN patients pat ON p.patient_id=pat.id JOIN users p_u ON pat.user_id=p_u.id JOIN doctors doc ON a.doctor_id=doc.id JOIN users d_u ON doc.user_id=d_u.id
        ORDER BY p.created_at DESC`;
      params = [];
    }
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

const refundPayment = async (req, res, next) => {
  try {
    const payment = await query('SELECT * FROM payments WHERE id=$1', [req.params.id]);
    if (payment.rows.length === 0) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.rows[0].payment_status !== 'completed') return res.status(400).json({ success: false, message: 'Only completed payments can be refunded.' });

    const refund = await razorpay.payments.refund(payment.rows[0].razorpay_payment_id, { amount: Math.round(payment.rows[0].amount * 100) });
    await query(`UPDATE payments SET payment_status='refunded', refund_id=$1, refund_amount=$2, refund_date=NOW() WHERE id=$3`,
      [refund.id, payment.rows[0].amount, req.params.id]);

    res.json({ success: true, message: 'Refund initiated.', data: { refundId: refund.id } });
  } catch (error) { next(error); }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory, refundPayment };
