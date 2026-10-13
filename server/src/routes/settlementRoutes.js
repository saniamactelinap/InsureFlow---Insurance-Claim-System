import express from 'express';
import {
  listSettlements,
  getMySettlements,
  updateSettlementStatus,
} from '../controllers/settlementController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Customer endpoints
router.get('/my', getMySettlements);

// Staff endpoints
router.get('/', authorizeRoles('ADMIN', 'MANAGER', 'OFFICER'), listSettlements);
router.patch('/:id/status', authorizeRoles('ADMIN', 'MANAGER', 'OFFICER'), updateSettlementStatus);

export default router;
