import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getAllUsers,
  findUserById,
  // New OTP-related endpoints
  sendRegistrationOTP,
  verifyOTPAndRegister,
  getUserById
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Update routes
router.post('/register', registerUser); // Keep for backward compatibility
router.post('/send-otp', sendRegistrationOTP); // New endpoint to send OTP
router.post('/verify-otp', verifyOTPAndRegister); // New endpoint to verify OTP and register
router.post('/login', loginUser);
router.get('/profile', authMiddleware, findUserById); // Use findUserById if available
router.get('/all', authMiddleware, getAllUsers);
router.get('/:id', verifyToken, getUserById);

export default router;