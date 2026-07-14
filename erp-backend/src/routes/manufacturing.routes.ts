import { Router } from 'express';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';
import { createDraftProduction, previewProduction, confirmProduction, cancelProduction, getMOs, getMOById, deleteMO, createMO, createDirectManufacturing, createReverseManufacturing, updateMOStatus, getProductionPlan } from '../controllers/manufacturing.controller';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.post('/preview', previewProduction);
router.post('/direct', createDirectManufacturing);
router.post('/reverse', createReverseManufacturing);
router.post('/plan', getProductionPlan);
router.get('/', getMOs);
router.post('/', createDraftProduction);
router.get('/:id', getMOById);
router.post('/:id/confirm', confirmProduction);
router.post('/:id/cancel', cancelProduction);
router.put('/:id/status', updateMOStatus);
router.delete('/:id', deleteMO);

export default router;
