import { Router } from 'express';
import { getProfitAndLoss, getGstReport, getDaybook, getDashboardCharts } from '../controllers/reports.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);

router.get('/dashboard-charts', getDashboardCharts);
router.get('/pnl', getProfitAndLoss);
router.get('/gstr', getGstReport);
router.get('/daybook', getDaybook);

export default router;
