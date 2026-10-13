import express from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/my', getMyNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAllReadHandler);

function markAllAllReadHandler(req, res, next) {
  markAllAsRead(req, res, next);
}

export default router;
