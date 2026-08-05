const express = require('express');
const { testEmail } = require('../controllers/testEmailController');
const { sendOTP, verifyOTP , resendOTP } = require("../controllers/verificationController");
const router = express.Router();
router.get('/test-email', testEmail);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
module.exports = router;


