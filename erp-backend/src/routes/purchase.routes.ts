import { Router } from 'express';
import {
  getPurchases, getPurchase, createPurchase, updatePurchase,
  updatePurchaseStatus, cancelPurchase, getPurchaseSummary,
} from '../controllers/purchase.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);

router.get('/analytics/summary', getPurchaseSummary);
router.get('/', getPurchases);
router.get('/:id', getPurchase);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.put('/:id/status', updatePurchaseStatus);
router.delete('/:id', cancelPurchase);

export default router;
