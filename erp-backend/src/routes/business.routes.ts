import { Router } from 'express';
import { getBusinessProfile, updateBusinessProfile } from '../controllers/business.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);

router.get('/', getBusinessProfile);
// Only admins should be able to update the business profile
router.put('/', authorize('admin'), updateBusinessProfile);

export default router;
