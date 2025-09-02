import prisma from '@/config/database';
import { validateSchema, validationSchemas } from '@/utils/validation';
import { 
  IQuizCreate, 
  IQuizUpdate,
  IQuestionCreate,
  IQuizAttemptCreate,
  IPaginationParams,
  IPaginatedResponse,
  IAIQuestionRequest
} from '@/types';
import { CustomError } from '@/middleware/errorHandler';
import logger from '@/utils/logger';
import axios from 'axios';

export class QuizService {
  /**
   * Create quiz
   */
  static async createQuiz(
    quizData: IQuizCreate,
    createdById: string
  ): Promise<any> {
    try {
      // Validate input data
      const validatedData = validateSchema(validationSchemas.quizCreate, quizData);

      // Check if subject exists
      const subject = await prisma.subject.findUnique({
        where: { id: validatedData.subjectId },
        include: {
          grade: {
            include: {
              institution: true
            }
          }
        }
      });

      if (!subject) {
        throw new CustomError('Subject not found', 404);
      }

      // Check if institution is approved
      if (validatedData.institutionId) {
        const institution = await prisma.institution.findUnique({
          where: { id: validatedData.institutionId }
        });

        if (!institution || !institution.approved) {
          throw new CustomError('Institution must be approved', 403);
        }
      }

      // Create quiz
      const quiz = await prisma.quiz.create({
        data: {
          ...validatedData,
          createdById,
          institutionId: validatedData.institutionId || subject.grade.institution.id
        },
        include: {
          subject: {
            include: {
              grade: {
                include: {
                  institution: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      logger.info(`New quiz created: ${quiz.id} by user ${createdById}`);

      return quiz;
    } catch (error) {
      logger.error('Create quiz error:', error);
      throw error;
    }
  }

  /**
   * Generate quiz using AI
   */
  static async generateQuizWithAI(
    aiRequest: IAIQuestionRequest,
    createdById: string
  ): Promise<any> {
    try {
      // TODO: Integrate with actual AI service
      // For now, create a mock quiz structure
      const mockQuestions = [
        {
          text: `Sample question about ${aiRequest.topic} in ${aiRequest.subject}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          answer: 'Option A',
          difficulty: aiRequest.difficulty,
          points: 1
        }
      ];

      // Create quiz with generated questions
      const quiz = await prisma.quiz.create({
        data: {
          title: `AI Generated Quiz - ${aiRequest.topic}`,
          description: `Automatically generated quiz about ${aiRequest.topic}`,
          createdById,
          subjectId: '', // This should be provided or derived
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
          durationMins: 30,
          settings: {
            allowRetake: false,
            showResults: true,
            randomizeQuestions: true,
            timeLimit: true,
            passingScore: 60
          },
          institutionId: null
        }
      });

      // Create questions
      const questions = await Promise.all(
        mockQuestions.map(q => 
          prisma.question.create({
            data: {
              quizId: quiz.id,
              text: q.text,
              options: q.options,
              answer: q.answer,
              difficulty: q.difficulty,
              points: q.points
            }
          })
        )
      );

      logger.info(`AI quiz generated: ${quiz.id} with ${questions.length} questions`);

      return {
        quiz,
        questions
      };
    } catch (error) {
      logger.error('Generate AI quiz error:', error);
      throw error;
    }
  }

  /**
   * Get quizzes with filtering and pagination
   */
  static async getQuizzes(
    filters: {
      institutionId?: string;
      subjectId?: string;
      status?: 'upcoming' | 'active' | 'completed';
      createdById?: string;
    } = {},
    pagination: IPaginationParams = {}
  ): Promise<IPaginatedResponse<any>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filters.institutionId) {
        where.institutionId = filters.institutionId;
      }

      if (filters.subjectId) {
        where.subjectId = filters.subjectId;
      }

      if (filters.createdById) {
        where.createdById = filters.createdById;
      }

      // Apply status filters
      const now = new Date();
      if (filters.status === 'upcoming') {
        where.startTime = { gt: now };
      } else if (filters.status === 'active') {
        where.startTime = { lte: now };
        where.endTime = { gt: now };
        where.isActive = true;
      } else if (filters.status === 'completed') {
        where.endTime = { lte: now };
        where.isCompleted = true;
      }

      // Get total count
      const total = await prisma.quiz.count({ where });

      // Get quizzes
      const quizzes = await prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subject: {
            include: {
              grade: {
                include: {
                  institution: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          questions: {
            select: {
              id: true,
              text: true,
              difficulty: true,
              points: true
            }
          },
          attempts: {
            select: {
              id: true,
              score: true,
              completed: true
            }
          }
        }
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: quizzes,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Get quizzes error:', error);
      throw error;
    }
  }

  /**
   * Get quiz by ID
   */
  static async getQuizById(quizId: string, includeAnswers: boolean = false): Promise<any> {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          subject: {
            include: {
              grade: {
                include: {
                  institution: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          questions: {
            select: {
              id: true,
              text: true,
              options: true,
              difficulty: true,
              points: true,
              ...(includeAnswers && { answer: true })
            }
          }
        }
      });

      if (!quiz) {
        throw new CustomError('Quiz not found', 404);
      }

      return quiz;
    } catch (error) {
      logger.error('Get quiz by ID error:', error);
      throw error;
    }
  }

  /**
   * Update quiz
   */
  static async updateQuiz(
    quizId: string,
    updateData: IQuizUpdate
  ): Promise<any> {
    try {
      const updatedQuiz = await prisma.quiz.update({
        where: { id: quizId },
        data: updateData,
        include: {
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

      logger.info(`Quiz updated: ${quizId}`);

      return updatedQuiz;
    } catch (error) {
      logger.error('Update quiz error:', error);
      throw error;
    }
  }

  /**
   * Add question to quiz
   */
  static async addQuestion(questionData: IQuestionCreate): Promise<any> {
    try {
      // Validate input data
      const validatedData = validateSchema(validationSchemas.questionCreate, questionData);

      // Check if quiz exists
      const quiz = await prisma.quiz.findUnique({
        where: { id: validatedData.quizId }
      });

      if (!quiz) {
        throw new CustomError('Quiz not found', 404);
      }

      // Create question
      const question = await prisma.question.create({
        data: validatedData
      });

      logger.info(`Question added to quiz: ${question.id} in quiz ${validatedData.quizId}`);

      return question;
    } catch (error) {
      logger.error('Add question error:', error);
      throw error;
    }
  }

  /**
   * Start quiz attempt
   */
  static async startQuizAttempt(
    quizId: string,
    studentId: string
  ): Promise<any> {
    try {
      // Check if quiz exists and is active
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: true
        }
      });

      if (!quiz) {
        throw new CustomError('Quiz not found', 404);
      }

      const now = new Date();
      if (now < quiz.startTime || now > quiz.endTime) {
        throw new CustomError('Quiz is not currently active', 400);
      }

      // Check if student has already attempted this quiz
      const existingAttempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId,
          studentId,
          completed: false
        }
      });

      if (existingAttempt) {
        throw new CustomError('You already have an active attempt for this quiz', 400);
      }

      // Calculate max score
      const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);

      // Create quiz attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId,
          studentId,
          answers: {},
          score: 0,
          maxScore,
          completed: false,
          startedAt: new Date()
        }
      });

      logger.info(`Quiz attempt started: ${attempt.id} for quiz ${quizId} by student ${studentId}`);

      return {
        attemptId: attempt.id,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          durationMins: quiz.durationMins,
          startTime: quiz.startTime,
          endTime: quiz.endTime,
          questions: quiz.questions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            difficulty: q.difficulty,
            points: q.points
          }))
        }
      };
    } catch (error) {
      logger.error('Start quiz attempt error:', error);
      throw error;
    }
  }

  /**
   * Submit quiz attempt
   */
  static async submitQuizAttempt(
    attemptId: string,
    answers: any,
    studentId: string
  ): Promise<any> {
    try {
      // Get attempt
      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          quiz: {
            include: {
              questions: true
            }
          }
        }
      });

      if (!attempt) {
        throw new CustomError('Quiz attempt not found', 404);
      }

      if (attempt.studentId !== studentId) {
        throw new CustomError('Unauthorized access to quiz attempt', 403);
      }

      if (attempt.completed) {
        throw new CustomError('Quiz attempt already completed', 400);
      }

      // Calculate score
      let score = 0;
      const questionAnswers: any = {};

      for (const question of attempt.quiz.questions) {
        const studentAnswer = answers[question.id];
        questionAnswers[question.id] = studentAnswer;

        if (studentAnswer === question.answer) {
          score += question.points;
        }
      }

      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / (1000 * 60));

      // Update attempt
      const updatedAttempt = await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          answers: questionAnswers,
          score,
          completed: true,
          submittedAt: new Date(),
          timeSpent
        }
      });

      logger.info(`Quiz attempt submitted: ${attemptId} with score ${score}/${attempt.maxScore}`);

      return {
        attemptId: updatedAttempt.id,
        score: updatedAttempt.score,
        maxScore: updatedAttempt.maxScore,
        percentage: Math.round((updatedAttempt.score / updatedAttempt.maxScore) * 100),
        timeSpent: updatedAttempt.timeSpent,
        completed: updatedAttempt.completed
      };
    } catch (error) {
      logger.error('Submit quiz attempt error:', error);
      throw error;
    }
  }

  /**
   * Get quiz results
   */
  static async getQuizResults(quizId: string, userId: string, userRole: string): Promise<any> {
    try {
      // Get quiz with attempts
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          attempts: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  phoneNumber: true
                }
              }
            }
          },
          questions: true
        }
      });

      if (!quiz) {
        throw new CustomError('Quiz not found', 404);
      }

      // Check if user can view results
      const canViewAll = ['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR', 'ADMIN', 'TEACHER'].includes(userRole);
      const isCreator = quiz.createdById === userId;

      if (!canViewAll && !isCreator) {
        // Students can only see their own results
        const studentAttempt = quiz.attempts.find(a => a.studentId === userId);
        if (!studentAttempt) {
          throw new CustomError('No attempt found for this quiz', 404);
        }

        return {
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description
          },
          attempts: [studentAttempt]
        };
      }

      // Teachers/Admins can see all results
      return {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          totalQuestions: quiz.questions.length,
          totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0)
        },
        attempts: quiz.attempts,
        statistics: {
          totalAttempts: quiz.attempts.length,
          averageScore: quiz.attempts.length > 0 
            ? Math.round(quiz.attempts.reduce((sum, a) => sum + a.score, 0) / quiz.attempts.length)
            : 0,
          completionRate: quiz.attempts.length > 0
            ? Math.round((quiz.attempts.filter(a => a.completed).length / quiz.attempts.length) * 100)
            : 0
        }
      };
    } catch (error) {
      logger.error('Get quiz results error:', error);
      throw error;
    }
  }

  /**
   * Schedule quiz
   */
  static async scheduleQuiz(
    quizId: string,
    scheduleData: {
      startTime: Date;
      endTime: Date;
      durationMins: number;
    }
  ): Promise<any> {
    try {
      const updatedQuiz = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          durationMins: scheduleData.durationMins
        }
      });

      logger.info(`Quiz scheduled: ${quizId} from ${scheduleData.startTime} to ${scheduleData.endTime}`);

      return updatedQuiz;
    } catch (error) {
      logger.error('Schedule quiz error:', error);
      throw error;
    }
  }

  /**
   * Delete quiz
   */
  static async deleteQuiz(quizId: string): Promise<{ message: string }> {
    try {
      // Check if quiz has any attempts
      const attempts = await prisma.quizAttempt.findMany({
        where: { quizId }
      });

      if (attempts.length > 0) {
        throw new CustomError('Cannot delete quiz with existing attempts', 400);
      }

      // Delete questions first
      await prisma.question.deleteMany({
        where: { quizId }
      });

      // Delete quiz
      await prisma.quiz.delete({
        where: { id: quizId }
      });

      logger.info(`Quiz deleted: ${quizId}`);

      return {
        message: 'Quiz deleted successfully'
      };
    } catch (error) {
      logger.error('Delete quiz error:', error);
      throw error;
    }
  }
}
