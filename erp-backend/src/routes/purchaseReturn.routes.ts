import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getPurchaseReturns,
  getPurchaseReturn,
  createPurchaseReturn,
  updatePurchaseReturn,
  updatePurchaseReturnStatus,
  getPredictedPurchaseReturnNumber,
  getPurchaseReturnSummary,
  cancelPurchaseReturn,
} from '../controllers/purchaseReturn.controller';

const router = express.Router();

router.use(protect);

router.get('/analytics/summary', getPurchaseReturnSummary);
router.get('/next-number/:type', getPredictedPurchaseReturnNumber);
router.get('/', getPurchaseReturns);
router.get('/:id', getPurchaseReturn);
router.post('/', createPurchaseReturn);
router.put('/:id', updatePurchaseReturn);
router.put('/:id/status', updatePurchaseReturnStatus);
router.delete('/:id', cancelPurchaseReturn);

export default router;
