import express from 'express';
import {
  listProducts,
  getProductById,
  compareProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/policyProductController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public catalog endpoints
router.get('/', listProducts);
router.get('/compare', compareProducts);
router.get('/:id', getProductById);

// Admin-only product management
router.post('/', authenticate, authorizeRoles('ADMIN'), createProduct);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), updateProduct);
router.patch('/:id/publish', authenticate, authorizeRoles('ADMIN'), updateProduct);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), deleteProduct);

export default router;
