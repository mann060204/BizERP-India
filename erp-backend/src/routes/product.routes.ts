import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, createBulkProducts } from '../controllers/product.controller';
import { protect, checkLockedFY, checkLockedFY } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.post('/bulk', createBulkProducts);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
