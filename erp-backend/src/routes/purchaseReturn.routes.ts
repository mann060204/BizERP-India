import express from 'express';
import {
  getPurchaseReturns,
  getPurchaseReturn,
  createPurchaseReturn,
  updatePurchaseReturn,
  updatePurchaseReturnStatus,
  getPredictedPurchaseReturnNumber,
} from '../controllers/purchaseReturn.controller';

const router = express.Router();

router.get('/next-number', getPredictedPurchaseReturnNumber);
router.get('/', getPurchaseReturns);
router.get('/:id', getPurchaseReturn);
router.post('/', createPurchaseReturn);
router.put('/:id', updatePurchaseReturn);
router.put('/:id/status', updatePurchaseReturnStatus);

export default router;
