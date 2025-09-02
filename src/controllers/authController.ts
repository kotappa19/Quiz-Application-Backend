import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import { ApiResponse } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export class AuthController {
  /**
   * User signup
   * POST /auth/signup
   */
  static signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.signup(req.body);
    
    logger.info(`User signup successful: ${result.user.phoneNumber}`);
    
    ApiResponse.success(res, result, result.message, 201);
  });

  /**
   * User login
   * POST /auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.login(req.body);
    
    logger.info(`User login successful: ${result.user.phoneNumber}`);
    
    ApiResponse.success(res, result, 'Login successful');
  });

  /**
   * Send OTP
   * POST /auth/send-otp
   */
  static sendOTP = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      ApiResponse.badRequest(res, 'Phone number is required');
      return;
    }

    const result = await AuthService.sendOTP(phoneNumber);
    
    logger.info(`OTP sent to: ${phoneNumber}`);
    
    ApiResponse.success(res, result, 'OTP sent successfully');
  });

  /**
   * Verify OTP
   * POST /auth/verify-otp
   */
  static verifyOTP = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.verifyOTP(req.body);
    
    logger.info(`OTP verified for: ${req.body.phoneNumber}`);
    
    ApiResponse.success(res, result, 'OTP verified successfully');
  });

  /**
   * Reset password
   * PUT /auth/reset-password
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.resetPassword(req.body);
    
    logger.info(`Password reset for: ${req.body.phoneNumber}`);
    
    ApiResponse.success(res, result, 'Password reset successfully');
  });

  /**
   * Get user profile
   * GET /auth/profile
   */
  static getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const user = await AuthService.getProfile(userId);
    
    ApiResponse.success(res, user, 'Profile retrieved successfully');
  });

  /**
   * Update user profile
   * PUT /auth/profile
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const user = await AuthService.updateProfile(userId, req.body);
    
    logger.info(`Profile updated for user: ${userId}`);
    
    ApiResponse.success(res, user, 'Profile updated successfully');
  });

  /**
   * Refresh token
   * POST /auth/refresh
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // This would typically involve validating a refresh token
    // and generating a new access token
    ApiResponse.success(res, { message: 'Token refresh endpoint' }, 'Token refresh endpoint');
  });

  /**
   * Logout
   * POST /auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    
    if (userId) {
      logger.info(`User logged out: ${userId}`);
    }
    
    ApiResponse.success(res, { message: 'Logged out successfully' }, 'Logged out successfully');
  });
}
