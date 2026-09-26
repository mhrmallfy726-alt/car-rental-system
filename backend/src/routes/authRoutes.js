const express = require('express');
const { register, login, getMe, uploadDocs, resubmitSupplierDocuments, updateProfile, updateNotificationPreferences, requestPasswordChangeOTP, changePassword, uploadBrandLogo, requestPasswordReset, verifyPasswordReset, resetPassword } = require('../controllers/authController');
const {
  resendOTP,
  verifyOTP
} = require('../controllers/verificationController');

const { protect } = require('../middleware/auth');
const { uploadDocuments, uploadAvatar } = require('../middleware/upload');
const branchAccountRoutes = require('./branchAccountRoutes');

const router = express.Router();

router.post(
    '/register',
    uploadDocuments,
    register
  );
  
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.use('/branch', branchAccountRoutes);
router.post('/forgot-password', requestPasswordReset);
router.post('/forgot-password/verify', verifyPasswordReset);
router.post('/forgot-password/reset', resetPassword);
router.get('/me', protect, getMe);
router.post('/upload-documents', protect, uploadDocuments, uploadDocs);
// يتحقق الكنترولر من البريد وكلمة المرور عند عدم وجود جلسة، لأن المورد المرفوض لا يحصل على جلسة دخول.
router.post('/resubmit-supplier-documents', uploadDocuments, resubmitSupplierDocuments);
router.put('/update-profile', protect, updateProfile);
router.put('/notification-preferences', protect, updateNotificationPreferences);
router.post('/change-password/request-otp', protect, requestPasswordChangeOTP);
router.put('/change-password', protect, changePassword);
router.post('/upload-brand-logo', protect, uploadAvatar, uploadBrandLogo);

module.exports = router;
