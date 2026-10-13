import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/stats', getDashboardStats);

export default router;
