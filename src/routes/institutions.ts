import { Router } from 'express';
import { InstitutionController } from '@/controllers/institutionController';
import { 
  authenticate, 
  authorize, 
  requireInstitutionAccess 
} from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Institution management routes
router.post('/', 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'ADMIN'] }), 
  InstitutionController.createInstitution
);

router.get('/', 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR', 'ADMIN'] }), 
  InstitutionController.getInstitutions
);

router.get('/:id', 
  requireInstitutionAccess('id'), 
  InstitutionController.getInstitutionById
);

router.put('/:id', 
  requireInstitutionAccess('id'), 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'ADMIN'] }), 
  InstitutionController.updateInstitution
);

router.delete('/:id', 
  authorize({ requiredRoles: ['SUPER_ADMIN'] }), 
  InstitutionController.deleteInstitution
);

// Institution approval (Super Admin only)
router.put('/:id/approve', 
  authorize({ requiredRoles: ['SUPER_ADMIN'] }), 
  InstitutionController.approveInstitution
);

// Institution statistics
router.get('/:id/statistics', 
  requireInstitutionAccess('id'), 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR', 'ADMIN'] }), 
  InstitutionController.getInstitutionStatistics
);

// Institution users management
router.get('/:id/users', 
  requireInstitutionAccess('id'), 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR', 'ADMIN'] }), 
  InstitutionController.getInstitutionUsers
);

router.put('/:id/users/:userId/approve', 
  requireInstitutionAccess('id'), 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'ADMIN'] }), 
  InstitutionController.approveInstitutionUser
);

// Grade management routes
router.post('/:institutionId/grades', 
  requireInstitutionAccess('institutionId'), 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR', 'ADMIN'] }), 
  InstitutionController.createGrade
);

router.get('/:institutionId/grades', 
  requireInstitutionAccess('institutionId'), 
  InstitutionController.getGrades
);

// Subject management routes
router.post('/grades/:gradeId/subjects', 
  authorize({ requiredRoles: ['SUPER_ADMIN', 'GLOBAL_CONTENT_CREATOR', 'ADMIN', 'TEACHER'] }), 
  InstitutionController.createSubject
);

router.get('/grades/:gradeId/subjects', 
  InstitutionController.getSubjects
);

export default router;
