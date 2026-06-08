import { Router } from 'express';
import { getInventoryLevels, adjustInventory, getAdjustments, autoSequenceBatches, getBatchAlerts, getBatchLogs, listBatches, saveBatch } from '../controllers/inventory.controller';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.get('/', getInventoryLevels);
router.post('/adjust', adjustInventory);
router.get('/adjustments', getAdjustments);
router.post('/auto-sequence', autoSequenceBatches);
router.get('/batch-alerts', getBatchAlerts);
router.get('/batch-logs', getBatchLogs);
router.get('/batches', listBatches);
router.post('/batches', saveBatch);

export default router;
