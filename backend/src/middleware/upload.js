const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { v2: cloudinary } = require('cloudinary');
// multer-storage-cloudinary@2.x exports the storage constructor directly.
const CloudinaryStorage = require('multer-storage-cloudinary');

const uploadDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// ========================
// Local Storage (Fallback)
// ========================
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const carImageStorage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'car-rental/cars',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      },
    })
  : localStorage;

// ========================
// File Filter
// ========================
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

  // السجل التجاري يجب أن يكون PDF فقط
  if (file.fieldname === 'commercial_register') {
    const isPdf = file.mimetype === 'application/pdf' || extension === '.pdf';

    if (!isPdf) {
      return cb(new Error('السجل التجاري يجب أن يكون ملف PDF فقط'), false);
    }

    return cb(null, true);
  }

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/jfif',
    'application/pdf',
  ];
  const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.jfif',
    '.pdf',
  ];

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
    return cb(null, true);
  }

  return cb(new Error('يُسمح فقط بـ JPG, PNG, PDF للوثائق'), false);
};

// ========================
// Upload Configurations
// ========================
const uploadCarImages = multer({
  storage: carImageStorage,
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

const advertisementUploadDir = path.join(__dirname, '../../uploads/advertisements');
fs.mkdirSync(advertisementUploadDir, { recursive: true });

const advertisementStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, advertisementUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const uploadAdvertisementImage = multer({
  storage: advertisementStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('image');

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
  uploadAdvertisementImage,
};
