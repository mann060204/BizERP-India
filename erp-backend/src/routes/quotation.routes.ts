import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation, getNextQuotationNumber, convertToInvoice
} from '../controllers/quotation.controller';

const router = Router();

router.use(protect);

router.get('/next-number', getNextQuotationNumber);
router.get('/', getQuotations);
router.get('/:id', getQuotation);
router.post('/', createQuotation);
router.post('/:id/convert', convertToInvoice);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

export default router;
