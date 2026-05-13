import { Router } from 'express';
import { getInventoryLevels, adjustInventory, getAdjustments } from '../controllers/inventory.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);

router.get('/', getInventoryLevels);
router.post('/adjust', adjustInventory);
router.get('/adjustments', getAdjustments);

export default router;
