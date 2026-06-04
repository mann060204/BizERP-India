import { Router } from 'express';
import { protect, checkLockedFY, checkLockedFY } from '../middlewares/auth.middleware';
import { createBOM, getBOMs, getBOMById, updateBOM, deleteBOM } from '../controllers/bom.controller';

const router = Router();

router.use(protect);
router.use(checkLockedFY);

router.post('/', createBOM);
router.get('/', getBOMs);
router.get('/:id', getBOMById);
router.put('/:id', updateBOM);
router.delete('/:id', deleteBOM);

export default router;
