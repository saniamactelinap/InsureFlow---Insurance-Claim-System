import express from 'express';
import { listUsers, createStaffUser, updateUser, toggleUserStatus } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// List users: accessible to ADMIN, OFFICER, MANAGER (Officers and Managers need surveyor directory for claim assignment)
router.get('/', authorizeRoles('ADMIN', 'OFFICER', 'MANAGER'), listUsers);

// Staff management mutations strictly restricted to ADMIN
router.post('/', authorizeRoles('ADMIN'), createStaffUser);
router.post('/staff', authorizeRoles('ADMIN'), createStaffUser);
router.put('/:id', authorizeRoles('ADMIN'), updateUser);
router.patch('/:id/toggle-status', authorizeRoles('ADMIN'), toggleUserStatus);
router.patch('/:id/status', authorizeRoles('ADMIN'), toggleUserStatus);

export default router;
