const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const audioDir = path.join(__dirname, '../uploads/audio');
const avatarDir = path.join(__dirname, '../uploads/avatars');

// Create directories if they don't exist
[audioDir, avatarDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for audio files
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for avatar images
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for audio files
const audioFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed!'), false);
  }
};

// File filter for avatar images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create Multer instances
const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for audio
  }
});

// ✅ ADDED: Avatar upload configuration
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  }
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB for audio, 5MB for images.'
      });
    }
  }
  next(error);
};

// ✅ UPDATED: Export both upload configurations
module.exports = {
  uploadAudio, 
  uploadAvatar, // ✅ Now this exists!
  handleMulterError
};