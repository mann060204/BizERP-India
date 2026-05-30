import { Router } from 'express';
import {
  getInvoices, getInvoice, createInvoice, updateInvoice,
  updateInvoiceStatus, cancelInvoice, getSalesSummary,
  getCustomerLastPrice, getPredictedInvoiceNumber, getPublicInvoice
} from '../controllers/invoice.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/public/:id', getPublicInvoice);

router.use(protect);

router.get('/analytics/summary', getSalesSummary);
router.get('/next-number', getPredictedInvoiceNumber);
router.get('/last-price', getCustomerLastPrice);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.put('/:id/status', updateInvoiceStatus);
router.delete('/:id', cancelInvoice);

export default router;
