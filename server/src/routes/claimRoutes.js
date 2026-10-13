import express from 'express';
import {
  createClaim,
  getMyClaims,
  listClaims,
  getClaimById,
  uploadAdditionalDocument,
  requestAdditionalDocuments,
  recommendClaim,
  assignOfficer,
} from '../controllers/claimController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Customer claim actions
router.post('/', upload.array('documents', 5), createClaim);
router.get('/my', getMyClaims);

// Staff claim list & queue
router.get('/', authorizeRoles('ADMIN', 'MANAGER', 'OFFICER', 'SURVEYOR'), listClaims);

// Single claim detail
router.get('/:id', getClaimById);

// Additional document uploads (customer or staff)
router.post('/:id/documents', upload.single('document'), uploadAdditionalDocument);

// Officer workflow actions
router.post('/:id/request-documents', authorizeRoles('ADMIN', 'OFFICER'), requestAdditionalDocuments);
router.post('/:id/recommend', authorizeRoles('ADMIN', 'OFFICER'), recommendClaim);
router.patch('/:id/assign-officer', authorizeRoles('ADMIN', 'MANAGER'), assignOfficer);

export default router;
