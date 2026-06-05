import { Router } from 'express';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getNextPurchaseOrderNumber,
  convertToPurchaseBill,
  getPurchaseOrderSummary
} from '../controllers/purchaseOrder.controller';

const router = Router();

router.use(protect);
router.use(checkLockedFY);

router.get('/next-number', getNextPurchaseOrderNumber);
router.get('/analytics/summary', getPurchaseOrderSummary);
router.post('/:id/convert', convertToPurchaseBill);

router.route('/')
  .get(getPurchaseOrders)
  .post(createPurchaseOrder);

router.route('/:id')
  .get(getPurchaseOrder)
  .put(updatePurchaseOrder)
  .delete(deletePurchaseOrder);

export default router;
