import express from 'express';
import * as reportsController from '../controllers/reports.controller';

const router = express.Router();

// Accounts Reports
router.get('/accounts/cash-book', reportsController.getCashBook);
router.get('/accounts/business-book', reportsController.getBusinessBook);
router.get('/accounts/payment-paid', reportsController.getPaymentPaid);
router.get('/accounts/payment-received', reportsController.getPaymentReceived);
router.get('/accounts/chart-of-accounts', reportsController.getChartOfAccounts);
router.get('/accounts/balance-sheet', reportsController.getBalanceSheet);

// Inventory Reports
router.get('/inventory/item-register', reportsController.getItemRegister);
router.get('/inventory/low-level-stock', reportsController.getLowLevelStock);
router.get('/inventory/stock-availability', reportsController.getStockAvailability);
router.get('/inventory/stock-adjustment', reportsController.getStockAdjustment);
router.get('/inventory/consumable-stock', reportsController.getConsumableStock);
router.get('/inventory/fast-moving', reportsController.getFastMovingItems);
router.get('/inventory/slow-moving', reportsController.getSlowMovingItems);
router.get('/inventory/available-serials', reportsController.getAvailableSerials);
router.get('/inventory/item-list', reportsController.getItemList);

export default router;
