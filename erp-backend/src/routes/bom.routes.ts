import { Router } from 'express';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';
import { createBOM, getBOMs, getBOMById, getBOMByProduct, saveBOMForProduct, updateBOM, deleteBOM } from '../controllers/bom.controller';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.get('/', getBOMs);
router.post('/', createBOM);
router.get('/product/:productId', getBOMByProduct);
router.post('/product/:productId', saveBOMForProduct);
router.get('/:id', getBOMById);
router.put('/:id', updateBOM);
router.delete('/:id', deleteBOM);

export default router;
