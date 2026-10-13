import express from 'express';
import { listUsers, createStaffUser, updateUser, toggleUserStatus } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/', listUsers);
router.post('/staff', createStaffUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;
