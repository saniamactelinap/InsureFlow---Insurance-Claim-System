import express from 'express';
import {
  getPendingDecisions,
  approveClaim,
  rejectClaim,
  returnForInquiry,
} from '../controllers/managerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('MANAGER', 'ADMIN'));

router.get('/pending-decisions', getPendingDecisions);
router.post('/claims/:id/approve', approveClaim);
router.post('/claims/:id/reject', rejectClaim);
router.post('/claims/:id/inquiry', returnForInquiry);

export default router;
