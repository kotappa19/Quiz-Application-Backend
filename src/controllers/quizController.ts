import { Request, Response } from 'express';
import { QuizService } from '@/services/quizService';
import { ApiResponse } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateSchema, validationSchemas } from '@/utils/validation';
import logger from '@/utils/logger';
import prisma from '@/config/database';

export class QuizController {
  /**
   * Create quiz
   * POST /quizzes
   */
  static createQuiz = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const createdById = (req as any).user?.id;
    
    if (!createdById) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const result = await QuizService.createQuiz(req.body, createdById);
    
    logger.info(`Quiz created: ${result.id} by user ${createdById}`);
    
    ApiResponse.success(res, result, 'Quiz created successfully', 201);
  });

  /**
   * Generate quiz using AI
   * POST /quizzes/ai-generate
   */
  static generateQuizWithAI = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const createdById = (req as any).user?.id;
    
    if (!createdById) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const result = await QuizService.generateQuizWithAI(req.body, createdById);
    
    logger.info(`AI quiz generated: ${result.quiz.id} by user ${createdById}`);
    
    ApiResponse.success(res, result, 'AI quiz generated successfully', 201);
  });

  /**
   * Get quizzes with filtering
   * GET /quizzes
   */
  static getQuizzes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { 
      page, 
      limit, 
      sortBy, 
      sortOrder, 
      institutionId, 
      subjectId, 
      status, 
      createdById 
    } = req.query;
    
    const filters = {
      institutionId: institutionId as string,
      subjectId: subjectId as string,
      status: status as 'upcoming' | 'active' | 'completed',
      createdById: createdById as string
    };
    
    const pagination = { 
      page: Number(page), 
      limit: Number(limit), 
      sortBy, 
      sortOrder 
    };
    
    const result = await QuizService.getQuizzes(filters, pagination);
    
    ApiResponse.success(res, result, 'Quizzes retrieved successfully');
  });

  /**
   * Get upcoming quizzes
   * GET /quizzes/upcoming
   */
  static getUpcomingQuizzes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sortBy, sortOrder, institutionId, subjectId } = req.query;
    
    const filters = {
      institutionId: institutionId as string,
      subjectId: subjectId as string,
      status: 'upcoming' as const
    };
    
    const pagination = { 
      page: Number(page), 
      limit: Number(limit), 
      sortBy, 
      sortOrder 
    };
    
    const result = await QuizService.getQuizzes(filters, pagination);
    
    ApiResponse.success(res, result, 'Upcoming quizzes retrieved successfully');
  });

  /**
   * Get active quizzes
   * GET /quizzes/active
   */
  static getActiveQuizzes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sortBy, sortOrder, institutionId, subjectId } = req.query;
    
    const filters = {
      institutionId: institutionId as string,
      subjectId: subjectId as string,
      status: 'active' as const
    };
    
    const pagination = { 
      page: Number(page), 
      limit: Number(limit), 
      sortBy, 
      sortOrder 
    };
    
    const result = await QuizService.getQuizzes(filters, pagination);
    
    ApiResponse.success(res, result, 'Active quizzes retrieved successfully');
  });

  /**
   * Get completed quizzes
   * GET /quizzes/completed
   */
  static getCompletedQuizzes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sortBy, sortOrder, institutionId, subjectId } = req.query;
    
    const filters = {
      institutionId: institutionId as string,
      subjectId: subjectId as string,
      status: 'completed' as const
    };
    
    const pagination = { 
      page: Number(page), 
      limit: Number(limit), 
      sortBy, 
      sortOrder 
    };
    
    const result = await QuizService.getQuizzes(filters, pagination);
    
    ApiResponse.success(res, result, 'Completed quizzes retrieved successfully');
  });

  /**
   * Get quiz by ID
   * GET /quizzes/:id
   */
  static getQuizById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { includeAnswers } = req.query;
    
    const includeAnswersBool = includeAnswers === 'true';
    const result = await QuizService.getQuizById(id, includeAnswersBool);
    
    ApiResponse.success(res, result, 'Quiz retrieved successfully');
  });

  /**
   * Update quiz
   * PUT /quizzes/:id
   */
  static updateQuiz = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const result = await QuizService.updateQuiz(id, req.body);
    
    logger.info(`Quiz updated: ${id}`);
    
    ApiResponse.success(res, result, 'Quiz updated successfully');
  });

  /**
   * Schedule quiz
   * PUT /quizzes/:id/schedule
   */
  static scheduleQuiz = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { startTime, endTime, durationMins } = req.body;
    
    if (!startTime || !endTime || !durationMins) {
      ApiResponse.badRequest(res, 'Start time, end time, and duration are required');
      return;
    }

    const result = await QuizService.scheduleQuiz(id, {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      durationMins: Number(durationMins)
    });
    
    logger.info(`Quiz scheduled: ${id}`);
    
    ApiResponse.success(res, result, 'Quiz scheduled successfully');
  });

  /**
   * Add question to quiz
   * POST /quizzes/:id/questions
   */
  static addQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: quizId } = req.params;
    
    const questionData = {
      ...req.body,
      quizId
    };

    const result = await QuizService.addQuestion(questionData);
    
    logger.info(`Question added to quiz: ${result.id} in quiz ${quizId}`);
    
    ApiResponse.success(res, result, 'Question added successfully', 201);
  });

  /**
   * Start quiz attempt
   * POST /quizzes/:id/attempt
   */
  static startQuizAttempt = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: quizId } = req.params;
    const studentId = (req as any).user?.id;
    
    if (!studentId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const result = await QuizService.startQuizAttempt(quizId, studentId);
    
    logger.info(`Quiz attempt started: ${result.attemptId} for quiz ${quizId} by student ${studentId}`);
    
    ApiResponse.success(res, result, 'Quiz attempt started successfully');
  });

  /**
   * Submit quiz attempt
   * PUT /quizzes/:id/submit
   */
  static submitQuizAttempt = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: quizId } = req.params;
    const { attemptId, answers } = req.body;
    const studentId = (req as any).user?.id;
    
    if (!studentId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    if (!attemptId || !answers) {
      ApiResponse.badRequest(res, 'Attempt ID and answers are required');
      return;
    }

    const result = await QuizService.submitQuizAttempt(attemptId, answers, studentId);
    
    logger.info(`Quiz attempt submitted: ${attemptId} for quiz ${quizId} by student ${studentId}`);
    
    ApiResponse.success(res, result, 'Quiz submitted successfully');
  });

  /**
   * Get quiz results
   * GET /quizzes/:id/results
   */
  static getQuizResults = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: quizId } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const result = await QuizService.getQuizResults(quizId, userId, userRole);
    
    ApiResponse.success(res, result, 'Quiz results retrieved successfully');
  });

  /**
   * Delete quiz
   * DELETE /quizzes/:id
   */
  static deleteQuiz = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const result = await QuizService.deleteQuiz(id);
    
    logger.info(`Quiz deleted: ${id}`);
    
    ApiResponse.success(res, result, 'Quiz deleted successfully');
  });

  /**
   * Get quiz statistics
   * GET /quizzes/:id/statistics
   */
  static getQuizStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: quizId } = req.params;
    
    // Get quiz with attempts
    const quiz = await QuizService.getQuizById(quizId);
    
    // Get attempt statistics
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      select: {
        score: true,
        maxScore: true,
        completed: true,
        timeSpent: true,
        startedAt: true,
        submittedAt: true
      }
    });

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completed).length;
    const averageScore = totalAttempts > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
      : 0;
    const averageTimeSpent = completedAttempts > 0
      ? Math.round(attempts.filter(a => a.completed).reduce((sum, a) => sum + (a.timeSpent || 0), 0) / completedAttempts)
      : 0;

    const statistics = {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        totalQuestions: quiz.questions.length,
        totalPoints: quiz.questions.reduce((sum: number, q: any) => sum + q.points, 0)
      },
      attempts: {
        total: totalAttempts,
        completed: completedAttempts,
        pending: totalAttempts - completedAttempts
      },
      performance: {
        averageScore,
        averageTimeSpent,
        completionRate: totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0
      }
    };
    
    ApiResponse.success(res, statistics, 'Quiz statistics retrieved successfully');
  });

  /**
   * Get questions for quiz
   * GET /quizzes/:id/questions
   */
  static getQuizQuestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: quizId } = req.params;
    const { includeAnswers } = req.query;
    
    const includeAnswersBool = includeAnswers === 'true';
    const quiz = await QuizService.getQuizById(quizId, includeAnswersBool);
    
    const questions = quiz.questions.map((q: any) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      difficulty: q.difficulty,
      points: q.points,
      ...(includeAnswersBool && { answer: q.answer })
    }));
    
    ApiResponse.success(res, { questions }, 'Quiz questions retrieved successfully');
  });
}
