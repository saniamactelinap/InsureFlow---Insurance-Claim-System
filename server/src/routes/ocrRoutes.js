import express from 'express';
import { getOcrJobByDocument, correctOcrFields, reprocessOcr, scanDocument } from '../controllers/ocrController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Real-time document scanning & OCR extraction during claim filing
router.post('/scan', upload.single('document'), scanDocument);

router.get('/document/:documentId', getOcrJobByDocument);
router.patch('/jobs/:jobId/correct', authorizeRoles('ADMIN', 'OFFICER', 'MANAGER'), correctOcrFields);
router.post('/document/:documentId/reprocess', authorizeRoles('ADMIN', 'OFFICER'), reprocessOcr);

export default router;
