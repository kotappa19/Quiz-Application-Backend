import { Router } from 'express';
import authRoutes from './auth';
import institutionRoutes from './institutions';
import quizRoutes from './quizzes';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Quiz Application API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount route modules
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/institutions`, institutionRoutes);
router.use(`${API_VERSION}/quizzes`, quizRoutes);

// API documentation endpoint
router.get(`${API_VERSION}/docs`, (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /signup': 'User registration',
        'POST /login': 'User login',
        'POST /send-otp': 'Send OTP for verification',
        'POST /verify-otp': 'Verify OTP',
        'PUT /reset-password': 'Reset user password',
        'GET /profile': 'Get user profile (authenticated)',
        'PUT /profile': 'Update user profile (authenticated)',
        'POST /logout': 'User logout (authenticated)'
      },
      institutions: {
        'POST /': 'Create institution (Admin/SuperAdmin)',
        'GET /': 'List institutions',
        'GET /:id': 'Get institution by ID',
        'PUT /:id': 'Update institution',
        'DELETE /:id': 'Delete institution (SuperAdmin)',
        'PUT /:id/approve': 'Approve/reject institution (SuperAdmin)',
        'GET /:id/statistics': 'Get institution statistics',
        'GET /:id/users': 'Get institution users',
        'PUT /:id/users/:userId/approve': 'Approve/reject institution user',
        'POST /:institutionId/grades': 'Create grade',
        'GET /:institutionId/grades': 'Get grades for institution',
        'POST /grades/:gradeId/subjects': 'Create subject',
        'GET /grades/:gradeId/subjects': 'Get subjects for grade'
      },
      quizzes: {
        'POST /': 'Create quiz (Teacher/Admin/GlobalContentCreator)',
        'POST /ai-generate': 'Generate quiz using AI',
        'GET /': 'Get quizzes with filtering',
        'GET /upcoming': 'Get upcoming quizzes',
        'GET /active': 'Get active quizzes',
        'GET /completed': 'Get completed quizzes',
        'GET /:id': 'Get quiz by ID',
        'PUT /:id': 'Update quiz',
        'DELETE /:id': 'Delete quiz',
        'PUT /:id/schedule': 'Schedule quiz',
        'POST /:id/questions': 'Add question to quiz',
        'GET /:id/questions': 'Get quiz questions',
        'POST /:id/attempt': 'Start quiz attempt (Student)',
        'PUT /:id/submit': 'Submit quiz attempt (Student)',
        'GET /:id/results': 'Get quiz results',
        'GET /:id/statistics': 'Get quiz statistics'
      }
    },
    authentication: 'JWT Bearer token required for protected endpoints',
    roles: {
      SUPER_ADMIN: 'Full system access',
      GLOBAL_CONTENT_CREATOR: 'Create global content and manage institutions',
      ADMIN: 'Manage institution and users',
      TEACHER: 'Create and manage quizzes',
      STUDENT: 'Take quizzes and view results'
    }
  });
});

export default router;
