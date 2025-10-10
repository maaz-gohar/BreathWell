const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadAvatar, handleMulterError } = require('../config/multer');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Protected routes
router.use(authMiddleware);

// ✅ FIXED: Profile update with avatar upload
router.put(
  '/profile',
  uploadAvatar.single('avatar'), // ✅ Now uploadAvatar exists
  handleMulterError,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required')
  ],
  authController.updateProfile
);

// ✅ ADDED: Separate route for avatar upload only
router.put(
  '/avatar',
  uploadAvatar.single('avatar'),
  handleMulterError,
  authController.updateAvatar
);

// ✅ ADDED: Get user profile
router.get('/profile', authController.getProfile);

module.exports = router;