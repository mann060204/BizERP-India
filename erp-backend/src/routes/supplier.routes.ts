import { Router } from 'express';
import { getSuppliers, getSupplier, createSupplier, bulkCreateSuppliers, updateSupplier, deleteSupplier, getSupplierLedger, recordPayment, addLedgerAdjustment, updateSupplierLedgerEntry, deleteSupplierLedgerEntry } from '../controllers/supplier.controller';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.get('/', getSuppliers);
router.post('/', createSupplier);
router.post('/bulk', bulkCreateSuppliers);

router.get('/:id', getSupplier);
router.get('/:id/ledger', getSupplierLedger);
router.post('/:id/payments', recordPayment);
router.post('/:id/adjustments', addLedgerAdjustment);
router.put('/:id/ledger/:ledgerId', updateSupplierLedgerEntry);
router.delete('/:id/ledger/:ledgerId', deleteSupplierLedgerEntry);

router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
