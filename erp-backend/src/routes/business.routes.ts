import { Router } from 'express';
import { getBusinessProfile, updateBusinessProfile, updateSequences } from '../controllers/business.controller';
import { exportData, eraseData, importData } from '../controllers/data.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);

router.get('/', getBusinessProfile);
// Only admins should be able to update the business profile
router.put('/', authorize('admin'), updateBusinessProfile);
router.put('/sequences', authorize('admin'), updateSequences);

// Data Management
router.get('/data/export', authorize('admin'), exportData);
router.delete('/data/erase', authorize('admin'), eraseData);
router.post('/data/import', authorize('admin'), importData);

export default router;
