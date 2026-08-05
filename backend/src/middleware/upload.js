const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ========================
// Local Storage (Fallback)
// ========================
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ========================
// File Filter
// ========================
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, WEBP'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('يُسمح فقط بـ JPG, PNG, PDF للوثائق'), false);
  }
};

// ========================
// Upload Configurations
// ========================
const uploadCarImages = multer({
  storage: localStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
}).array('images', 10);

const uploadDocuments = multer({
  storage: localStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFilter,
}).fields([
  { name: 'id_card', maxCount: 2 },
  { name: 'driver_license', maxCount: 2 },

  // ملفات المورد
  { name: 'avatar', maxCount: 1 },
  { name: 'commercial_register', maxCount: 1 },
  { name: 'owner_id', maxCount: 1 },
]);
const uploadAvatar = multer({
  storage: localStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFilter,
}).single('avatar');

const uploadHandoverImages = multer({
  storage: localStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).array('images', 20);

const uploadComplaintAttachment = multer({
  storage: localStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFilter,
}).single('attachment');

module.exports = {
  uploadCarImages,
  uploadDocuments,
  uploadAvatar,
  uploadHandoverImages,
  uploadComplaintAttachment,
};
