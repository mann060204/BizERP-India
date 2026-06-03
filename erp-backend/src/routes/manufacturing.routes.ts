import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { createMO, getMOs, updateMOStatus, deleteMO } from '../controllers/manufacturing.controller';

const router = Router();

router.use(protect);

router.post('/', createMO);
router.get('/', getMOs);
router.put('/:id/status', updateMOStatus);
router.delete('/:id', deleteMO);

export default router;
