import express from 'express';
import {
  getMyPolicies,
  listAllPolicies,
  getPolicyById,
  registerExternalPolicy,
  applyForPlatformPolicy,
  verifyExternalPolicy,
} from '../controllers/customerPolicyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Customer endpoints
router.get('/my', getMyPolicies);
router.post('/register-external', upload.single('policyDocument'), registerExternalPolicy);
router.post('/apply-platform', applyForPlatformPolicy);

// Staff endpoints
router.get('/', authorizeRoles('ADMIN', 'MANAGER', 'OFFICER'), listAllPolicies);
router.patch('/:id/verify-external', authorizeRoles('ADMIN', 'OFFICER'), verifyExternalPolicy);

// Single policy detail
router.get('/:id', getPolicyById);

export default router;
