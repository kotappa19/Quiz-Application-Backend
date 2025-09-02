import { Router } from 'express';
import { QuizController } from '@/controllers/quizController';
import { 
  authenticate, 
  authorize, 
  requireQuizAccess,
  requireQuizCreationAccess,
  requireQuizParticipationAccess
} from '@/middleware/auth';
import { quizSubmissionLimiter } from '@/middleware/rateLimit';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Quiz management routes
router.post('/', 
  requireQuizCreationAccess(), 
  QuizController.createQuiz
);

router.post('/ai-generate', 
  requireQuizCreationAccess(), 
  QuizController.generateQuizWithAI
);

router.get('/', 
  QuizController.getQuizzes
);

router.get('/upcoming', 
  QuizController.getUpcomingQuizzes
);

router.get('/active', 
  QuizController.getActiveQuizzes
);

router.get('/completed', 
  QuizController.getCompletedQuizzes
);

// Individual quiz routes
router.get('/:id', 
  requireQuizAccess(), 
  QuizController.getQuizById
);

router.put('/:id', 
  requireQuizAccess(), 
  requireQuizCreationAccess(), 
  QuizController.updateQuiz
);

router.delete('/:id', 
  requireQuizAccess(), 
  requireQuizCreationAccess(), 
  QuizController.deleteQuiz
);

// Quiz scheduling
router.put('/:id/schedule', 
  requireQuizAccess(), 
  requireQuizCreationAccess(), 
  QuizController.scheduleQuiz
);

// Quiz questions
router.post('/:id/questions', 
  requireQuizAccess(), 
  requireQuizCreationAccess(), 
  QuizController.addQuestion
);

router.get('/:id/questions', 
  requireQuizAccess(), 
  QuizController.getQuizQuestions
);

// Quiz participation
router.post('/:id/attempt', 
  requireQuizAccess(), 
  requireQuizParticipationAccess(), 
  QuizController.startQuizAttempt
);

router.put('/:id/submit', 
  requireQuizAccess(), 
  requireQuizParticipationAccess(), 
  quizSubmissionLimiter, 
  QuizController.submitQuizAttempt
);

// Quiz results and statistics
router.get('/:id/results', 
  requireQuizAccess(), 
  QuizController.getQuizResults
);

router.get('/:id/statistics', 
  requireQuizAccess(), 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR', 'ADMIN', 'TEACHER'] }), 
  QuizController.getQuizStatistics
);

export default router;
