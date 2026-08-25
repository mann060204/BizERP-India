import express from 'express';
import {
  getDiscountSchemes,
  getDiscountScheme,
  createDiscountScheme,
  updateDiscountScheme,
  updateSchemeStatus,
  calculateDiscounts
} from '../controllers/discountSchemes.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect); // All routes require authentication

// Apply rules at sales invoice
router.post('/calculate', calculateDiscounts);

router
  .route('/')
  .get(getDiscountSchemes)
  .post(authorize('ADMIN', 'MANAGER'), createDiscountScheme);

router
  .route('/:id')
  .get(getDiscountScheme)
  .put(authorize('ADMIN', 'MANAGER'), updateDiscountScheme);

router
  .route('/:id/status')
  .put(authorize('ADMIN', 'MANAGER'), updateSchemeStatus);

export default router;
