import { Router } from 'express';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getSupplierLedger, recordPayment } from '../controllers/supplier.controller';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.get('/:id/ledger', getSupplierLedger);
router.post('/:id/payments', recordPayment);

router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
