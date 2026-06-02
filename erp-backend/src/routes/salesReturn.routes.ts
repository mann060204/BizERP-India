import express from 'express';
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

router.get('/analytics/summary', getSalesReturnSummary);
router.get('/next-number', getPredictedSalesReturnNumber);
router.get('/', getSalesReturns);
router.get('/:id', getSalesReturn);
router.post('/', createSalesReturn);
router.put('/:id', updateSalesReturn);
router.put('/:id/status', updateSalesReturnStatus);
router.delete('/:id', cancelSalesReturn);

export default router;
