const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const useSupabase = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

let storage;

if (useSupabase) {
  const { createSupabaseStorage } = require('../services/supabaseStorage');
  storage = createSupabaseStorage();
} else {
  // Local fallback for development. Railway production should use Supabase.
  const uploadDir = path.join(__dirname, '../../uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/jfif'];
  const extension = path.extname(file.originalname || '').toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif'];
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, WEBP'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || '').toLowerCase();

  if (file.fieldname === 'commercial_register') {
    const isPdf = file.mimetype === 'application/pdf' || extension === '.pdf';
    if (!isPdf) return cb(new Error('السجل التجاري يجب أن يكون ملف PDF فقط'), false);
    return cb(null, true);
  }

  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'image/jfif', 'application/pdf',
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.pdf'];

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
    return cb(null, true);
  }

  return cb(new Error('يُسمح فقط بـ JPG, PNG, PDF للوثائق'), false);
};

const uploadCarImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).array('images', 10);

const uploadDocuments = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFilter,
}).fields([
  { name: 'id_card', maxCount: 2 },
  { name: 'driver_license', maxCount: 2 },
  { name: 'avatar', maxCount: 1 },
  { name: 'commercial_register', maxCount: 1 },
  { name: 'owner_id', maxCount: 1 },
]);

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('avatar');

const uploadHandoverImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).array('images', 20);

const uploadAdvertisementImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('image');

const uploadComplaintAttachment = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFilter,
}).single('attachment');

module.exports = {
  uploadCarImages,
  uploadDocuments,
  uploadAvatar,
  uploadHandoverImages,
  uploadComplaintAttachment,
  uploadAdvertisementImage,
};
