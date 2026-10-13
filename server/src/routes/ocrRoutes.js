import express from 'express';
import { getOcrJobByDocument, correctOcrFields, reprocessOcr } from '../controllers/ocrController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/document/:documentId', getOcrJobByDocument);
router.patch('/jobs/:jobId/correct', authorizeRoles('ADMIN', 'OFFICER', 'MANAGER'), correctOcrFields);
router.post('/document/:documentId/reprocess', authorizeRoles('ADMIN', 'OFFICER'), reprocessOcr);

export default router;
