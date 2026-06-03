import express from 'express';
import * as reportsController from '../controllers/reports.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect);

// --- RESTORED OLD REPORTS ---
router.get('/dashboard-charts', reportsController.getDashboardCharts as any);
router.get('/pnl', reportsController.getProfitAndLoss as any);
router.get('/gstr', reportsController.getGstReport as any);
router.get('/daybook', reportsController.getDaybook as any);

// --- ACCOUNTS REPORTS ---
router.get('/accounts/cash-book', reportsController.getCashBook as any);
router.get('/accounts/business-book', reportsController.getBusinessBook as any);
router.get('/accounts/payment-paid', reportsController.getPaymentPaid as any);
router.get('/accounts/payment-received', reportsController.getPaymentReceived as any);
router.get('/accounts/chart-of-accounts', reportsController.getChartOfAccounts as any);
router.get('/accounts/balance-sheet', reportsController.getBalanceSheet as any);

// --- INVENTORY REPORTS ---
router.get('/inventory/item-register', reportsController.getItemRegister as any);
router.get('/inventory/low-level-stock', reportsController.getLowLevelStock as any);
router.get('/inventory/stock-availability', reportsController.getStockAvailability as any);
router.get('/inventory/stock-adjustment', reportsController.getStockAdjustment as any);
router.get('/inventory/consumable-stock', reportsController.getConsumableStock as any);
router.get('/inventory/fast-moving', reportsController.getFastMovingItems as any);
router.get('/inventory/slow-moving', reportsController.getSlowMovingItems as any);
router.get('/inventory/available-serials', reportsController.getAvailableSerials as any);
router.get('/inventory/item-list', reportsController.getItemList as any);

export default router;
