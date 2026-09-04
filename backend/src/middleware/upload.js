const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const uploadDir = process.env.UPLOAD_DIR || 'uploads/signatures';
const absoluteUploadDir = path.join(__dirname, '..', '..', uploadDir);

if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, absoluteUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `signature-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (png, jpg, jpeg, webp) are allowed for signatures.'));
  }
};

const maxSizeMb = parseInt(process.env.MAX_FILE_SIZE_MB || '2', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 }
});

module.exports = upload;
