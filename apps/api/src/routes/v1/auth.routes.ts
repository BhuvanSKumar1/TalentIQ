import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { strictRateLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', strictRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', strictRateLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);
router.post('/forgot-password', strictRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', strictRateLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post('/resend-verification', authenticate, AuthController.resendVerification);

export default router;
