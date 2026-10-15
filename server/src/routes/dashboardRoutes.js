import express from 'express';
import {
  getDashboardStats,
  getManagerDashboard,
  getAdminDashboard,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Universal stats endpoint
router.get('/stats', getDashboardStats);

// Dedicated role-specific dashboard endpoints
router.get('/manager', authorizeRoles('MANAGER', 'ADMIN'), getManagerDashboard);
router.get('/admin', authorizeRoles('ADMIN'), getAdminDashboard);

export default router;
