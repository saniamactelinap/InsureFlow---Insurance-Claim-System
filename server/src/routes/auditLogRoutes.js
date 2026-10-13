import express from 'express';
import { listAuditLogs } from '../controllers/auditLogController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/', listAuditLogs);

export default router;
