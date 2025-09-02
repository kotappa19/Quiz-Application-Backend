import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '@/utils/auth';
import { ApiResponse } from '@/utils/response';
import { IAuthRequest, IUser } from '@/types';
import prisma from '@/config/database';
import logger from '@/utils/logger';

export interface IAuthMiddlewareOptions {
  requiredRoles?: string[];
  requireApproval?: boolean;
  requireInstitution?: boolean;
}

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      ApiResponse.unauthorized(res, 'Access token is required');
      return;
    }

    const payload = AuthUtils.verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        institution: true
      }
    });

    if (!user) {
      ApiResponse.unauthorized(res, 'User not found');
      return;
    }

    // Check if user is approved
    if (!user.approved) {
      ApiResponse.forbidden(res, 'Account is pending approval');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    ApiResponse.unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Authorization middleware with role checking
 */
export const authorize = (options: IAuthMiddlewareOptions = {}) => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { requiredRoles = [], requireApproval = true, requireInstitution = false } = options;

      if (!req.user) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      // Check role requirements
      if (requiredRoles.length > 0 && !AuthUtils.hasRole(req.user, requiredRoles)) {
        ApiResponse.forbidden(res, 'Insufficient permissions');
        return;
      }

      // Check approval requirement
      if (requireApproval && !req.user.approved) {
        ApiResponse.forbidden(res, 'Account is pending approval');
        return;
      }

      // Check institution requirement
      if (requireInstitution && !req.user.institutionId) {
        ApiResponse.forbidden(res, 'Institution access required');
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      ApiResponse.internalServerError(res, 'Authorization check failed');
    }
  };
};

/**
 * Institution access control middleware
 */
export const requireInstitutionAccess = (institutionIdParam: string = 'institutionId') => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      const institutionId = req.params[institutionIdParam] || req.body[institutionIdParam];

      if (!institutionId) {
        ApiResponse.badRequest(res, 'Institution ID is required');
        return;
      }

      if (!AuthUtils.canAccessInstitution(req.user, institutionId)) {
        ApiResponse.forbidden(res, 'Access to this institution is denied');
        return;
      }

      next();
    } catch (error) {
      logger.error('Institution access check error:', error);
      ApiResponse.internalServerError(res, 'Institution access check failed');
    }
  };
};

/**
 * Quiz access control middleware
 */
export const requireQuizAccess = () => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      const quizId = req.params.quizId || req.body.quizId;

      if (!quizId) {
        ApiResponse.badRequest(res, 'Quiz ID is required');
        return;
      }

      // Get quiz with institution info
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          institution: true,
          subject: {
            include: {
              grade: {
                include: {
                  institution: true
                }
              }
            }
          }
        }
      });

      if (!quiz) {
        ApiResponse.notFound(res, 'Quiz not found');
        return;
      }

      // Check if user can access this quiz
      const quizInstitutionId = quiz.institutionId || quiz.subject.grade.institution.id;
      
      if (!AuthUtils.canAccessInstitution(req.user, quizInstitutionId)) {
        ApiResponse.forbidden(res, 'Access to this quiz is denied');
        return;
      }

      // Add quiz to request for later use
      (req as any).quiz = quiz;
      next();
    } catch (error) {
      logger.error('Quiz access check error:', error);
      ApiResponse.internalServerError(res, 'Quiz access check failed');
    }
  };
};

/**
 * User management middleware
 */
export const requireUserManagementAccess = (targetUserIdParam: string = 'userId') => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      const targetUserId = req.params[targetUserIdParam] || req.body[targetUserIdParam];

      if (!targetUserId) {
        ApiResponse.badRequest(res, 'Target user ID is required');
        return;
      }

      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!targetUser) {
        ApiResponse.notFound(res, 'Target user not found');
        return;
      }

      if (!AuthUtils.canManageUsers(req.user, targetUser)) {
        ApiResponse.forbidden(res, 'Cannot manage this user');
        return;
      }

      // Add target user to request for later use
      (req as any).targetUser = targetUser;
      next();
    } catch (error) {
      logger.error('User management access check error:', error);
      ApiResponse.internalServerError(res, 'User management access check failed');
    }
  };
};

/**
 * Quiz creation middleware
 */
export const requireQuizCreationAccess = () => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      if (!AuthUtils.canCreateQuiz(req.user)) {
        ApiResponse.forbidden(res, 'Cannot create quizzes');
        return;
      }

      next();
    } catch (error) {
      logger.error('Quiz creation access check error:', error);
      ApiResponse.internalServerError(res, 'Quiz creation access check failed');
    }
  };
};

/**
 * Quiz participation middleware
 */
export const requireQuizParticipationAccess = () => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      if (!AuthUtils.canTakeQuiz(req.user)) {
        ApiResponse.forbidden(res, 'Cannot participate in quizzes');
        return;
      }

      next();
    } catch (error) {
      logger.error('Quiz participation access check error:', error);
      ApiResponse.internalServerError(res, 'Quiz participation access check failed');
    }
  };
};
