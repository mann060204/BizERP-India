import { Router } from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, createBulkCustomers, getCustomerLedger, recordPayment, addLedgerAdjustment, updateCustomerLedgerEntry, deleteCustomerLedgerEntry } from '../controllers/customer.controller';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.post('/bulk', createBulkCustomers);
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.get('/:id/ledger', getCustomerLedger);
router.post('/:id/payments', recordPayment);
router.post('/:id/adjustments', addLedgerAdjustment);
router.put('/:id/ledger/:ledgerId', updateCustomerLedgerEntry);
router.delete('/:id/ledger/:ledgerId', deleteCustomerLedgerEntry);

router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
