import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getSalesReturns,
  getSalesReturn,
  createSalesReturn,
  updateSalesReturn,
  updateSalesReturnStatus,
  getPredictedSalesReturnNumber,
  getSalesReturnSummary,
  cancelSalesReturn,
} from '../controllers/salesReturn.controller';

const router = express.Router();

router.use(protect);

router.get('/analytics/summary', getSalesReturnSummary);
router.get('/next-number/:type', getPredictedSalesReturnNumber);
router.get('/', getSalesReturns);
router.get('/:id', getSalesReturn);
router.post('/', createSalesReturn);
router.put('/:id', updateSalesReturn);
router.put('/:id/status', updateSalesReturnStatus);
router.delete('/:id', cancelSalesReturn);

export default router;
