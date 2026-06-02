import express from 'express';
import {
  getSalesReturns,
  getSalesReturn,
  createSalesReturn,
  updateSalesReturn,
  updateSalesReturnStatus,
  getPredictedSalesReturnNumber,
} from '../controllers/salesReturn.controller';

const router = express.Router();

router.get('/next-number', getPredictedSalesReturnNumber);
router.get('/', getSalesReturns);
router.get('/:id', getSalesReturn);
router.post('/', createSalesReturn);
router.put('/:id', updateSalesReturn);
router.put('/:id/status', updateSalesReturnStatus);

export default router;
