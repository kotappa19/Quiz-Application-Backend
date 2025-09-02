import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IJWTPayload, IUser } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthUtils {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload: IJWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
      issuer: 'quiz-application',
      audience: 'quiz-application-users'
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): IJWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'quiz-application',
        audience: 'quiz-application-users'
      }) as IJWTPayload;
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate OTP code
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check if user has required role
   */
  static hasRole(user: IUser, requiredRoles: string[]): boolean {
    return requiredRoles.includes(user.role);
  }

  /**
   * Check if user can access institution resource
   */
  static canAccessInstitution(user: IUser, institutionId: string): boolean {
    // Super admin and global content creator can access all institutions
    if (user.role === 'SUPER_ADMIN' || user.role === 'GLOBAL_CONTENT_CREATOR') {
      return true;
    }

    // Other users can only access their own institution
    return user.institutionId === institutionId;
  }

  /**
   * Check if user can manage other users
   */
  static canManageUsers(user: IUser, targetUser: IUser): boolean {
    // Super admin can manage all users
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Global content creator can manage global content creators and below
    if (user.role === 'GLOBAL_CONTENT_CREATOR') {
      return ['GLOBAL_CONTENT_CREATOR', 'ADMIN', 'TEACHER', 'STUDENT'].includes(targetUser.role);
    }

    // Admin can manage users in their institution
    if (user.role === 'ADMIN' && user.institutionId === targetUser.institutionId) {
      return ['ADMIN', 'TEACHER', 'STUDENT'].includes(targetUser.role);
    }

    // Teacher can manage students in their institution
    if (user.role === 'TEACHER' && user.institutionId === targetUser.institutionId) {
      return targetUser.role === 'STUDENT';
    }

    return false;
  }

  /**
   * Check if user can create quizzes
   */
  static canCreateQuiz(user: IUser): boolean {
    return ['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR', 'ADMIN', 'TEACHER'].includes(user.role);
  }

  /**
   * Check if user can take quizzes
   */
  static canTakeQuiz(user: IUser): boolean {
    return user.role === 'STUDENT';
  }

  /**
   * Check if user can view results
   */
  static canViewResults(user: IUser, quizAttempt: any): boolean {
    // Users can always view their own results
    if (user.id === quizAttempt.studentId) {
      return true;
    }

    // Teachers and admins can view results for their institution
    if (['ADMIN', 'TEACHER'].includes(user.role)) {
      return user.institutionId === quizAttempt.institutionId;
    }

    // Super admin and global content creator can view all results
    if (['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR'].includes(user.role)) {
      return true;
    }

    return false;
  }

  /**
   * Extract token from authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: IJWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d' as any,
      issuer: 'quiz-application',
      audience: 'quiz-application-users'
    });
  }
}
