import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { createMO, createDirectManufacturing, createReverseManufacturing, getMOs, updateMOStatus, deleteMO, getProductionPlan } from '../controllers/manufacturing.controller';

const router = Router();

router.use(protect);

router.post('/', createMO);
router.post('/direct', createDirectManufacturing);
router.post('/reverse', createReverseManufacturing);
router.post('/plan', getProductionPlan);
router.get('/', getMOs);
router.put('/:id/status', updateMOStatus);
router.delete('/:id', deleteMO);

export default router;
