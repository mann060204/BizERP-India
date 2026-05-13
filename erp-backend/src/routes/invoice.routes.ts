import { Router } from 'express';
import {
  getInvoices, getInvoice, createInvoice, updateInvoice,
  updateInvoiceStatus, cancelInvoice, getSalesSummary,
} from '../controllers/invoice.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);

router.get('/analytics/summary', getSalesSummary);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.put('/:id/status', updateInvoiceStatus);
router.delete('/:id', cancelInvoice);

export default router;
