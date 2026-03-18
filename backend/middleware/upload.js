// Multer configuration for file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isServerlessRuntime = process.env.NETLIFY === 'true' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadsRoot = isServerlessRuntime
  ? path.join('/tmp', 'modulearn', 'uploads', 'profiles')
  : path.join(__dirname, '../uploads/profiles');

// Ensure uploads directory exists without crashing startup.
const ensureUploadsDir = () => {
  try {
    if (!fs.existsSync(uploadsRoot)) {
      fs.mkdirSync(uploadsRoot, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Unable to prepare uploads directory:', error.message);
    return false;
  }
};

const uploadsReady = ensureUploadsDir();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!uploadsReady && !ensureUploadsDir()) {
      return cb(new Error('Uploads directory is not writable'));
    }
    cb(null, uploadsRoot);
  },
  filename: (req, file, cb) => {
    // Create unique filename: userId_timestamp_originalname
    const uniqueName = `${req.user.userId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload;
