import { Request, Response } from 'express';
import { InstitutionService } from '@/services/institutionService';
import { ApiResponse } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateSchema, validationSchemas } from '@/utils/validation';
import logger from '@/utils/logger';
import prisma from '@/config/database';

export class InstitutionController {
  /**
   * Create institution
   * POST /institutions
   */
  static createInstitution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await InstitutionService.createInstitution(req.body);
    
    logger.info(`Institution created: ${result.id}`);
    
    ApiResponse.success(res, result, 'Institution created successfully. Pending approval.', 201);
  });

  /**
   * Get all institutions
   * GET /institutions
   */
  static getInstitutions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sortBy, sortOrder, approved } = req.query;
    
    const pagination = { page: Number(page), limit: Number(limit), sortBy, sortOrder };
    const approvedOnly = approved === 'true';
    
    const result = await InstitutionService.getInstitutions(pagination, approvedOnly);
    
    ApiResponse.success(res, result, 'Institutions retrieved successfully');
  });

  /**
   * Get institution by ID
   * GET /institutions/:id
   */
  static getInstitutionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const result = await InstitutionService.getInstitutionById(id);
    
    ApiResponse.success(res, result, 'Institution retrieved successfully');
  });

  /**
   * Approve/reject institution
   * PUT /institutions/:id/approve
   */
  static approveInstitution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { approved } = req.body;
    const approvedBy = (req as any).user?.id;
    
    if (typeof approved !== 'boolean') {
      ApiResponse.badRequest(res, 'Approval status is required');
      return;
    }

    const result = await InstitutionService.approveInstitution(id, approved, approvedBy!);
    
    logger.info(`Institution ${id} ${approved ? 'approved' : 'rejected'} by ${approvedBy}`);
    
    ApiResponse.success(res, result, `Institution ${approved ? 'approved' : 'rejected'} successfully`);
  });

  /**
   * Update institution
   * PUT /institutions/:id
   */
  static updateInstitution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const result = await InstitutionService.updateInstitution(id, req.body);
    
    logger.info(`Institution updated: ${id}`);
    
    ApiResponse.success(res, result, 'Institution updated successfully');
  });

  /**
   * Delete institution
   * DELETE /institutions/:id
   */
  static deleteInstitution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const result = await InstitutionService.deleteInstitution(id);
    
    logger.info(`Institution deleted: ${id}`);
    
    ApiResponse.success(res, result, 'Institution deleted successfully');
  });

  /**
   * Create grade
   * POST /institutions/:institutionId/grades
   */
  static createGrade = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { institutionId } = req.params;
    const gradeData = req.body;
    
    // Validate grade data
    if (!gradeData.name || gradeData.name.trim().length < 2) {
      ApiResponse.badRequest(res, 'Grade name must be at least 2 characters long');
      return;
    }

    const result = await InstitutionService.createGrade(institutionId, gradeData);
    
    logger.info(`Grade created: ${result.id} in institution ${institutionId}`);
    
    ApiResponse.success(res, result, 'Grade created successfully', 201);
  });

  /**
   * Get grades for institution
   * GET /institutions/:institutionId/grades
   */
  static getGrades = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { institutionId } = req.params;
    
    const result = await InstitutionService.getGrades(institutionId);
    
    ApiResponse.success(res, result, 'Grades retrieved successfully');
  });

  /**
   * Create subject
   * POST /grades/:gradeId/subjects
   */
  static createSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gradeId } = req.params;
    const subjectData = req.body;
    
    // Validate subject data
    if (!subjectData.name || subjectData.name.trim().length < 2) {
      ApiResponse.badRequest(res, 'Subject name must be at least 2 characters long');
      return;
    }

    const result = await InstitutionService.createSubject(gradeId, subjectData);
    
    logger.info(`Subject created: ${result.id} in grade ${gradeId}`);
    
    ApiResponse.success(res, result, 'Subject created successfully', 201);
  });

  /**
   * Get subjects for grade
   * GET /grades/:gradeId/subjects
   */
  static getSubjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gradeId } = req.params;
    
    const result = await InstitutionService.getSubjects(gradeId);
    
    ApiResponse.success(res, result, 'Subjects retrieved successfully');
  });

  /**
   * Get institution statistics
   * GET /institutions/:id/statistics
   */
  static getInstitutionStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    // Get basic institution info
    const institution = await InstitutionService.getInstitutionById(id);
    
    // Get counts
    const userCount = await prisma.user.count({
      where: { institutionId: id }
    });
    
    const gradeCount = await prisma.grade.count({
      where: { institutionId: id }
    });
    
    const subjectCount = await prisma.subject.count({
      where: {
        grade: {
          institutionId: id
        }
      }
    });
    
    const quizCount = await prisma.quiz.count({
      where: { institutionId: id }
    });

    const statistics = {
      institution,
      counts: {
        users: userCount,
        grades: gradeCount,
        subjects: subjectCount,
        quizzes: quizCount
      }
    };
    
    ApiResponse.success(res, statistics, 'Institution statistics retrieved successfully');
  });

  /**
   * Get institution users
   * GET /institutions/:id/users
   */
  static getInstitutionUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { page = 1, limit = 10, role, approved } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: any = { institutionId: id };
    
    if (role) {
      where.role = role;
    }
    
    if (approved !== undefined) {
      where.approved = approved === 'true';
    }

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        approved: true,
        createdAt: true
      }
    });

    const total = await prisma.user.count({ where });
    
    const result = {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
    
    ApiResponse.success(res, result, 'Institution users retrieved successfully');
  });

  /**
   * Approve/reject institution user
   * PUT /institutions/:id/users/:userId/approve
   */
  static approveInstitutionUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: institutionId, userId } = req.params;
    const { approved } = req.body;
    const approvedBy = (req as any).user?.id;
    
    if (typeof approved !== 'boolean') {
      ApiResponse.badRequest(res, 'Approval status is required');
      return;
    }

    // Check if user exists and belongs to institution
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        institutionId
      }
    });

    if (!user) {
      ApiResponse.notFound(res, 'User not found in this institution');
      return;
    }

    // Update user approval status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { approved }
    });

    logger.info(`User ${userId} ${approved ? 'approved' : 'rejected'} in institution ${institutionId} by ${approvedBy}`);
    
    ApiResponse.success(res, updatedUser, `User ${approved ? 'approved' : 'rejected'} successfully`);
  });
}
