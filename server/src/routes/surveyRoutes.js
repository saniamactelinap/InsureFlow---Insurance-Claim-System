import express from 'express';
import {
  assignSurveyor,
  getMyAssignedInspections,
  scheduleInspection,
  submitSurveyReport,
  getReportsByClaim,
} from '../controllers/surveyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Assign surveyor (Officer, Manager, Admin)
router.post('/assign', authorizeRoles('ADMIN', 'MANAGER', 'OFFICER'), assignSurveyor);

// Surveyor endpoints
router.get('/my-inspections', authorizeRoles('SURVEYOR', 'ADMIN'), getMyAssignedInspections);
router.patch('/assignments/:assignmentId/schedule', authorizeRoles('SURVEYOR', 'ADMIN'), scheduleInspection);
router.post('/reports', authorizeRoles('SURVEYOR', 'ADMIN'), upload.array('photos', 8), submitSurveyReport);

// Query reports for a claim
router.get('/claims/:claimId/reports', authorizeRoles('ADMIN', 'MANAGER', 'OFFICER', 'SURVEYOR'), getReportsByClaim);

export default router;
