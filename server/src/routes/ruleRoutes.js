import express from 'express';
import { listRules, updateRule } from '../controllers/ruleController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/', listRules);
router.put('/:id', updateRule);

export default router;
