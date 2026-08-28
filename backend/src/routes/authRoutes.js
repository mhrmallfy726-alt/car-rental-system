const express = require('express');
const { register, login, getMe, uploadDocs, updateProfile, uploadBrandLogo, requestPasswordReset, verifyPasswordReset, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadDocuments, uploadAvatar } = require('../middleware/upload');

const router = express.Router();

router.post(
    '/register',
    uploadDocuments,
    register
  );
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/forgot-password/verify', verifyPasswordReset);
router.post('/forgot-password/reset', resetPassword);
router.get('/me', protect, getMe);
router.post('/upload-documents', protect, uploadDocuments, uploadDocs);
router.put('/update-profile', protect, updateProfile);
router.post('/upload-brand-logo', protect, uploadAvatar, uploadBrandLogo);

module.exports = router;
