import { Router } from 'express';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);

router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
