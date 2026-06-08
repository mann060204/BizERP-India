import { Router } from 'express';
import {
  getPurchases, getPurchase, createPurchase, updatePurchase,
  updatePurchaseStatus, cancelPurchase, hardDeletePurchase, getPurchaseSummary, getLastPurchasePrices
} from '../controllers/purchase.controller';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.get('/analytics/summary', getPurchaseSummary);
router.get('/last-prices', getLastPurchasePrices);
router.get('/', getPurchases);
router.get('/:id', getPurchase);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.put('/:id/status', updatePurchaseStatus);
router.delete('/:id', cancelPurchase);
router.delete('/:id/hard', hardDeletePurchase);

export default router;
