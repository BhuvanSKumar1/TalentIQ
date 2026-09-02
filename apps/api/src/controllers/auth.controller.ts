import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateSecureToken, getPasswordResetExpiry, getEmailVerificationExpiry } from '../utils/tokens';
import { AuthRequest } from '../middleware/auth';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { logger } from '../utils/logger';
import { AuthAudit } from '../utils/audit';

export class AuthController {
  // ── Register ────────────────────────────────────────────
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, organizationName } = req.body as RegisterInput;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictError('A user with this email already exists');
      }

      const hashedPassword = await hashPassword(password);

      const organization = await prisma.organization.create({
        data: { name: organizationName },
      });

      const orgAdminRole = await prisma.roleModel.findFirst({
        where: { name: 'ORG_ADMIN' },
      });
      if (!orgAdminRole) {
        throw new Error('Default roles not found. Run seed script first.');
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          organizationId: organization.id,
          roleId: orgAdminRole.id,
        },
        include: { role: true, organization: true },
      });

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        organizationId: user.organizationId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Create email verification token
      const verificationToken = generateSecureToken();
      await prisma.emailVerificationToken.create({
        data: {
          token: verificationToken,
          userId: user.id,
          email: user.email,
          expiresAt: getEmailVerificationExpiry(),
        },
      });

      // Audit log
      await AuthAudit.userRegistered(user.id, user.organizationId, {
        email: user.email,
        ip: req.ip,
        ua: req.get('user-agent'),
      });

      logger.info({ userId: user.id }, 'User registered');

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          organization: user.organization,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
        // In production, send email instead of returning token
        emailVerificationToken: verificationToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Login ───────────────────────────────────────────────
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as LoginInput;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true, organization: true },
      });

      if (!user || !user.password) {
        await AuthAudit.loginFailed({
          email,
          ip: req.ip,
          ua: req.get('user-agent'),
          reason: 'user_not_found',
        });
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        await AuthAudit.loginFailed({
          email,
          ip: req.ip,
          ua: req.get('user-agent'),
          reason: 'invalid_password',
        });
        throw new UnauthorizedError('Invalid email or password');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account has been deactivated');
      }

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        organizationId: user.organizationId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Update last login and create refresh token
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }),
        prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      await AuthAudit.userLoggedIn(user.id, user.organizationId, {
        ip: req.ip,
        ua: req.get('user-agent'),
      });

      logger.info({ userId: user.id }, 'User logged in');

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          organization: user.organization,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Refresh Token ───────────────────────────────────────
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { role: true, organization: true } } },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      if (storedToken.revoked) {
        throw new UnauthorizedError('Refresh token has been revoked');
      }

      const payload = verifyRefreshToken(refreshToken);

      const tokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revoked: true },
        }),
        prisma.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: storedToken.userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Logout ──────────────────────────────────────────────
  static async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await prisma.refreshToken.updateMany({
          where: { userId: req.user.userId },
          data: { revoked: true },
        });

        await AuthAudit.userLoggedOut(req.user.userId, req.user.organizationId, {
          ip: req.ip,
          ua: req.get('user-agent'),
        });
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ── Get Current User ────────────────────────────────────
  static async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { role: true, organization: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        organization: { id: user.organization.id, name: user.organization.name },
        emailVerified: user.emailVerified,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Forgot Password ─────────────────────────────────────
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        return;
      }

      // Invalidate any existing reset tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      const resetToken = generateSecureToken();
      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: getPasswordResetExpiry(),
        },
      });

      await AuthAudit.passwordResetRequested(user.id, user.organizationId, {
        email: user.email,
        ip: req.ip,
        ua: req.get('user-agent'),
      });

      logger.info({ userId: user.id }, 'Password reset requested');

      // In production, send email with reset link
      res.json({
        message: 'If an account exists with that email, a reset link has been sent.',
        // In development, return token for testing
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Reset Password ──────────────────────────────────────
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: { include: { organization: true } } },
      });

      if (!resetToken || resetToken.used) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      if (resetToken.expiresAt < new Date()) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      const hashedPassword = await hashPassword(password);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { used: true },
        }),
        // Revoke all refresh tokens for security
        prisma.refreshToken.updateMany({
          where: { userId: resetToken.userId },
          data: { revoked: true },
        }),
      ]);

      await AuthAudit.passwordReset(resetToken.userId, resetToken.user.organizationId, {
        ip: req.ip,
        ua: req.get('user-agent'),
      });

      logger.info({ userId: resetToken.userId }, 'Password reset completed');

      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ── Verify Email ────────────────────────────────────────
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      const verificationToken = await prisma.emailVerificationToken.findUnique({
        where: { token },
        include: { user: { include: { organization: true } } },
      });

      if (!verificationToken || verificationToken.used) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      if (verificationToken.expiresAt < new Date()) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: verificationToken.userId },
          data: { emailVerified: true },
        }),
        prisma.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { used: true },
        }),
      ]);

      await AuthAudit.emailVerified(verificationToken.userId, verificationToken.user.organizationId, {
        ip: req.ip,
        ua: req.get('user-agent'),
      });

      logger.info({ userId: verificationToken.userId }, 'Email verified');

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ── Resend Verification Email ───────────────────────────
  static async resendVerification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.emailVerified) {
        res.json({ message: 'Email is already verified' });
        return;
      }

      // Invalidate old tokens
      await prisma.emailVerificationToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      const verificationToken = generateSecureToken();
      await prisma.emailVerificationToken.create({
        data: {
          token: verificationToken,
          userId: user.id,
          email: user.email,
          expiresAt: getEmailVerificationExpiry(),
        },
      });

      await AuthAudit.emailVerificationSent(user.id, user.organizationId, {
        email: user.email,
        ip: req.ip,
        ua: req.get('user-agent'),
      });

      res.json({
        message: 'Verification email sent',
        emailVerificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
      });
    } catch (error) {
      next(error);
    }
  }
}
