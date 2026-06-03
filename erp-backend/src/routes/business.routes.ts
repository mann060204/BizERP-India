import { Router } from 'express';
import { getBusinessProfile, updateBusinessProfile, updateSequences } from '../controllers/business.controller';
import { exportData, eraseData, importData } from '../controllers/data.controller';
import { startNewYear, getAvailableYears, switchYear } from '../controllers/financialYear.controller';
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

// Financial Year Management
router.post('/financial-year/start', authorize('admin'), startNewYear);
router.get('/financial-year/available', getAvailableYears);
router.post('/financial-year/switch', switchYear);

export default router;
