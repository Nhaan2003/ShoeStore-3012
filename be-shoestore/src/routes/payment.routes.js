const express = require('express');
const router = express.Router();

router.post('/vnpay/create', (req, res) => {
  res.json({ success: true, message: 'Create VNPay payment' });
});

router.get('/vnpay/return', (req, res) => {
  res.json({ success: true, message: 'VNPay return' });
});

module.exports = router;