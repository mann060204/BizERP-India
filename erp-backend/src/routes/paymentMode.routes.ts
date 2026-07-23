import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  listPaymentModes,
  createPaymentMode,
  updatePaymentMode,
  deletePaymentMode,
  resolveMode,
} from '../controllers/paymentMode.controller';

const router = Router();

router.use(protect);

router.get('/',          listPaymentModes);
router.get('/resolve',   resolveMode);       // GET /payment-modes/resolve?mode=UPI
router.post('/',         createPaymentMode);
router.put('/:id',       updatePaymentMode);
router.delete('/:id',    deletePaymentMode);

export default router;
