import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { authLimiter, otpLimiter } from '@/middleware/rateLimit';

const router = Router();

// Public routes (no authentication required)
router.post('/signup', authLimiter, AuthController.signup);
router.post('/login', authLimiter, AuthController.login);
router.post('/send-otp', otpLimiter, AuthController.sendOTP);
router.post('/verify-otp', otpLimiter, AuthController.verifyOTP);
router.put('/reset-password', authLimiter, AuthController.resetPassword);

// Protected routes (authentication required)
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);

export default router;
