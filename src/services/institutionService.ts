import prisma from '@/config/database';
import { validateSchema, validationSchemas } from '@/utils/validation';
import { 
  IInstitutionCreate, 
  IInstitution,
  IPaginationParams,
  IPaginatedResponse
} from '@/types';
import { CustomError } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export class InstitutionService {
  /**
   * Create institution
   */
  static async createInstitution(institutionData: IInstitutionCreate): Promise<IInstitution> {
    try {
      // Validate input data
      const validatedData = validateSchema(validationSchemas.institutionCreate, institutionData);

      // Check if admin exists and is approved
      const admin = await prisma.user.findUnique({
        where: { id: validatedData.adminId }
      });

      if (!admin) {
        throw new CustomError('Admin user not found', 404);
      }

      if (!admin.approved) {
        throw new CustomError('Admin account must be approved', 403);
      }

      // Create institution
      const institution = await prisma.institution.create({
        data: {
          name: validatedData.name,
          address: validatedData.address,
          adminId: validatedData.adminId,
          approved: false // Requires super admin approval
        }
      });

      logger.info(`New institution created: ${institution.id} by admin ${validatedData.adminId}`);

      return {
        id: institution.id,
        name: institution.name,
        address: institution.address,
        approved: institution.approved,
        adminId: institution.adminId,
        createdAt: institution.createdAt
      };
    } catch (error) {
      logger.error('Create institution error:', error);
      throw error;
    }
  }

  /**
   * Get all institutions (with pagination)
   */
  static async getInstitutions(
    pagination: IPaginationParams = {},
    approvedOnly: boolean = false
  ): Promise<IPaginatedResponse<IInstitution>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (approvedOnly) {
        where.approved = true;
      }

      // Get total count
      const total = await prisma.institution.count({ where });

      // Get institutions
      const institutions = await prisma.institution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true
            }
          }
        }
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: institutions.map(inst => ({
          id: inst.id,
          name: inst.name,
          address: inst.address,
          approved: inst.approved,
          adminId: inst.adminId,
          createdAt: inst.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Get institutions error:', error);
      throw error;
    }
  }

  /**
   * Get institution by ID
   */
  static async getInstitutionById(institutionId: string): Promise<IInstitution> {
    try {
      const institution = await prisma.institution.findUnique({
        where: { id: institutionId },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              role: true,
              approved: true
            }
          },
          grades: {
            select: {
              id: true,
              name: true,
              subjects: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!institution) {
        throw new CustomError('Institution not found', 404);
      }

      return {
        id: institution.id,
        name: institution.name,
        address: institution.address,
        approved: institution.approved,
        adminId: institution.adminId,
        createdAt: institution.createdAt
      };
    } catch (error) {
      logger.error('Get institution by ID error:', error);
      throw error;
    }
  }

  /**
   * Approve/reject institution
   */
  static async approveInstitution(
    institutionId: string, 
    approved: boolean, 
    approvedBy: string
  ): Promise<IInstitution> {
    try {
      // Check if institution exists
      const institution = await prisma.institution.findUnique({
        where: { id: institutionId }
      });

      if (!institution) {
        throw new CustomError('Institution not found', 404);
      }

      // Update institution approval status
      const updatedInstitution = await prisma.institution.update({
        where: { id: institutionId },
        data: { approved }
      });

      logger.info(`Institution ${institutionId} ${approved ? 'approved' : 'rejected'} by ${approvedBy}`);

      return {
        id: updatedInstitution.id,
        name: updatedInstitution.name,
        address: updatedInstitution.address,
        approved: updatedInstitution.approved,
        adminId: updatedInstitution.adminId,
        createdAt: updatedInstitution.createdAt
      };
    } catch (error) {
      logger.error('Approve institution error:', error);
      throw error;
    }
  }

  /**
   * Create grade
   */
  static async createGrade(
    institutionId: string,
    gradeData: { name: string }
  ): Promise<any> {
    try {
      // Validate input
      if (!gradeData.name || gradeData.name.trim().length < 2) {
        throw new CustomError('Grade name must be at least 2 characters long', 400);
      }

      // Check if institution exists and is approved
      const institution = await prisma.institution.findUnique({
        where: { id: institutionId }
      });

      if (!institution) {
        throw new CustomError('Institution not found', 404);
      }

      if (!institution.approved) {
        throw new CustomError('Institution must be approved', 403);
      }

      // Check if grade name already exists in this institution
      const existingGrade = await prisma.grade.findFirst({
        where: {
          name: gradeData.name,
          institutionId
        }
      });

      if (existingGrade) {
        throw new CustomError('Grade with this name already exists in this institution', 409);
      }

      // Create grade
      const grade = await prisma.grade.create({
        data: {
          name: gradeData.name,
          institutionId
        }
      });

      logger.info(`New grade created: ${grade.id} in institution ${institutionId}`);

      return grade;
    } catch (error) {
      logger.error('Create grade error:', error);
      throw error;
    }
  }

  /**
   * Get grades for institution
   */
  static async getGrades(institutionId: string): Promise<any[]> {
    try {
      const grades = await prisma.grade.findMany({
        where: { institutionId },
        include: {
          subjects: {
            select: {
              id: true,
              name: true
            }
          },
          students: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          teachers: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return grades;
    } catch (error) {
      logger.error('Get grades error:', error);
      throw error;
    }
  }

  /**
   * Create subject
   */
  static async createSubject(
    gradeId: string,
    subjectData: { name: string }
  ): Promise<any> {
    try {
      // Validate input
      if (!subjectData.name || subjectData.name.trim().length < 2) {
        throw new CustomError('Subject name must be at least 2 characters long', 400);
      }

      // Check if grade exists
      const grade = await prisma.grade.findUnique({
        where: { id: gradeId },
        include: {
          institution: true
        }
      });

      if (!grade) {
        throw new CustomError('Grade not found', 404);
      }

      // Check if institution is approved
      if (!grade.institution.approved) {
        throw new CustomError('Institution must be approved', 403);
      }

      // Check if subject name already exists in this grade
      const existingSubject = await prisma.subject.findFirst({
        where: {
          name: subjectData.name,
          gradeId
        }
      });

      if (existingSubject) {
        throw new CustomError('Subject with this name already exists in this grade', 409);
      }

      // Create subject
      const subject = await prisma.subject.create({
        data: {
          name: subjectData.name,
          gradeId
        }
      });

      logger.info(`New subject created: ${subject.id} in grade ${gradeId}`);

      return subject;
    } catch (error) {
      logger.error('Create subject error:', error);
      throw error;
    }
  }

  /**
   * Get subjects for grade
   */
  static async getSubjects(gradeId: string): Promise<any[]> {
    try {
      const subjects = await prisma.subject.findMany({
        where: { gradeId },
        include: {
          quizzes: {
            select: {
              id: true,
              title: true,
              isActive: true,
              isCompleted: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return subjects;
    } catch (error) {
      logger.error('Get subjects error:', error);
      throw error;
    }
  }

  /**
   * Update institution
   */
  static async updateInstitution(
    institutionId: string,
    updateData: Partial<IInstitutionCreate>
  ): Promise<IInstitution> {
    try {
      // Remove fields that shouldn't be updated
      const { adminId, ...allowedUpdates } = updateData;

      const updatedInstitution = await prisma.institution.update({
        where: { id: institutionId },
        data: allowedUpdates
      });

      logger.info(`Institution updated: ${institutionId}`);

      return {
        id: updatedInstitution.id,
        name: updatedInstitution.name,
        address: updatedInstitution.address,
        approved: updatedInstitution.approved,
        adminId: updatedInstitution.adminId,
        createdAt: updatedInstitution.createdAt
      };
    } catch (error) {
      logger.error('Update institution error:', error);
      throw error;
    }
  }

  /**
   * Delete institution (soft delete - mark as not approved)
   */
  static async deleteInstitution(institutionId: string): Promise<{ message: string }> {
    try {
      // Check if institution exists
      const institution = await prisma.institution.findUnique({
        where: { id: institutionId }
      });

      if (!institution) {
        throw new CustomError('Institution not found', 404);
      }

      // Mark as not approved instead of hard delete
      await prisma.institution.update({
        where: { id: institutionId },
        data: { approved: false }
      });

      logger.info(`Institution marked as deleted: ${institutionId}`);

      return {
        message: 'Institution deleted successfully'
      };
    } catch (error) {
      logger.error('Delete institution error:', error);
      throw error;
    }
  }
}
