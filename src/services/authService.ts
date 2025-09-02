import prisma from '@/config/database';
import { AuthUtils } from '@/utils/auth';
import { validateSchema, validationSchemas } from '@/utils/validation';
import { 
  ISignupRequest, 
  ILoginRequest, 
  IOTPVerification, 
  IResetPassword,
  IUser 
} from '@/types';
import { CustomError } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export class AuthService {
  /**
   * User signup
   */
  static async signup(userData: ISignupRequest): Promise<{ user: IUser; message: string }> {
    try {
      // Validate input data
      const validatedData = validateSchema(validationSchemas.userSignup, userData);

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phoneNumber: validatedData.phoneNumber },
            ...(validatedData.email ? [{ email: validatedData.email }] : [])
          ]
        }
      });

      if (existingUser) {
        throw new CustomError('User with this phone number or email already exists', 409);
      }

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(validatedData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          phoneNumber: validatedData.phoneNumber,
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          role: validatedData.role,
          institutionId: validatedData.institutionId,
          approved: validatedData.role === 'STUDENT' // Students are auto-approved
        }
      });

      logger.info(`New user registered: ${user.id} with role ${user.role}`);

      return {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          email: user.email,
          name: user.name,
          role: user.role,
          institutionId: user.institutionId,
          approved: user.approved,
          profilePic: user.profilePic,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        message: user.approved 
          ? 'User registered successfully' 
          : 'User registered successfully. Account pending approval.'
      };
    } catch (error) {
      logger.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * User login
   */
  static async login(loginData: ILoginRequest): Promise<{ user: IUser; token: string }> {
    try {
      // Validate input data
      const validatedData = validateSchema(validationSchemas.userLogin, loginData);

      // Find user by phone number
      const user = await prisma.user.findUnique({
        where: { phoneNumber: validatedData.phoneNumber },
        include: {
          institution: true
        }
      });

      if (!user) {
        throw new CustomError('Invalid phone number or password', 401);
      }

      // Check if user is approved
      if (!user.approved) {
        throw new CustomError('Account is pending approval', 403);
      }

      // Verify password
      const isPasswordValid = await AuthUtils.comparePassword(validatedData.password, user.password);
      if (!isPasswordValid) {
        throw new CustomError('Invalid phone number or password', 401);
      }

      // Generate JWT token
      const token = AuthUtils.generateToken({
        userId: user.id,
        role: user.role,
        institutionId: user.institutionId
      });

      logger.info(`User logged in: ${user.id}`);

      return {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          email: user.email,
          name: user.name,
          role: user.role,
          institutionId: user.institutionId,
          approved: user.approved,
          profilePic: user.profilePic,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Send OTP for phone verification
   */
  static async sendOTP(phoneNumber: string): Promise<{ message: string }> {
    try {
      // Validate phone number
      const validatedData = validateSchema(validationSchemas.otpVerification, {
        phoneNumber,
        code: '000000' // Dummy code for validation
      });

      // Generate OTP
      const otpCode = AuthUtils.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      await prisma.oTP.upsert({
        where: { phoneNumber: validatedData.phoneNumber },
        update: {
          code: otpCode,
          expiresAt
        },
        create: {
          phoneNumber: validatedData.phoneNumber,
          code: otpCode,
          expiresAt
        }
      });

      // TODO: Integrate with SMS service to send OTP
      // For development, log the OTP
      if (process.env.NODE_ENV === 'development') {
        logger.info(`OTP for ${phoneNumber}: ${otpCode}`);
      }

      logger.info(`OTP sent to: ${phoneNumber}`);

      return {
        message: 'OTP sent successfully'
      };
    } catch (error) {
      logger.error('Send OTP error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  static async verifyOTP(otpData: IOTPVerification): Promise<{ message: string }> {
    try {
      // Validate input data
      const validatedData = validateSchema(validationSchemas.otpVerification, otpData);

      // Find OTP record
      const otpRecord = await prisma.oTP.findUnique({
        where: { phoneNumber: validatedData.phoneNumber }
      });

      if (!otpRecord) {
        throw new CustomError('OTP not found or expired', 400);
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        // Delete expired OTP
        await prisma.oTP.delete({
          where: { id: otpRecord.id }
        });
        throw new CustomError('OTP has expired', 400);
      }

      // Verify OTP code
      if (otpRecord.code !== validatedData.code) {
        throw new CustomError('Invalid OTP code', 400);
      }

      // Delete used OTP
      await prisma.oTP.delete({
        where: { id: otpRecord.id }
      });

      logger.info(`OTP verified for: ${validatedData.phoneNumber}`);

      return {
        message: 'OTP verified successfully'
      };
    } catch (error) {
      logger.error('Verify OTP error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(resetData: IResetPassword): Promise<{ message: string }> {
    try {
      // Validate input data
      const validatedData = validateSchema(validationSchemas.resetPassword, resetData);

      // Find user by phone number
      const user = await prisma.user.findUnique({
        where: { phoneNumber: validatedData.phoneNumber }
      });

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Hash new password
      const hashedPassword = await AuthUtils.hashPassword(validatedData.newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      logger.info(`Password reset for user: ${user.id}`);

      return {
        message: 'Password reset successfully'
      };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(userId: string): Promise<IUser> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          institution: true
        }
      });

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      return {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
        approved: user.approved,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
    try {
      // Remove fields that shouldn't be updated
      const { id, phoneNumber, role, approved, createdAt, updatedAt, ...allowedUpdates } = updateData;

      // Hash password if it's being updated
      if (allowedUpdates.password) {
        allowedUpdates.password = await AuthUtils.hashPassword(allowedUpdates.password);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: allowedUpdates,
        include: {
          institution: true
        }
      });

      logger.info(`Profile updated for user: ${userId}`);

      return {
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        institutionId: updatedUser.institutionId,
        approved: updatedUser.approved,
        profilePic: updatedUser.profilePic,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }
}
