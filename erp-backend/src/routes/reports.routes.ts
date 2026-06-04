import express from 'express';
import * as reportsController from '../controllers/reports.controller';
import { protect, checkLockedFY, checkLockedFY } from '../middlewares/auth.middleware';

const router = express.Router();
router.use(protect);
router.use(checkLockedFY);

// --- CORE REPORTS ---
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

// --- SALES REPORTS ---
router.get('/sales/aging', reportsController.getSalesAging as any);
router.get('/sales/itemwise', reportsController.getSalesItemwise as any);
router.get('/sales/invoicewise', reportsController.getSalesInvoicewise as any);
router.get('/sales/invoicewise-margin', reportsController.getInvoicewiseMargin as any);
router.get('/sales/itemwise-margin', reportsController.getItemwiseMargin as any);
router.get('/sales/customerwise-margin', reportsController.getCustomerwiseMargin as any);
router.get('/sales/invoicewise-summary', reportsController.getSalesInvoicewiseSummary as any);
router.get('/sales/customerwise-summary', reportsController.getSalesCustomerwiseSummary as any);
router.get('/sales/itemwise-summary', reportsController.getSalesItemwiseSummary as any);
router.get('/sales/gst', reportsController.getSalesGST as any);
router.get('/sales/recurring', reportsController.getActiveRecurringInvoices as any);

// --- CUSTOMER REPORTS ---
router.get('/customers/amount-due', reportsController.getCustomerAmountDue as any);
router.get('/customers/payment-history', reportsController.getCustomerPaymentHistory as any);
router.get('/customers/account-balances', reportsController.getCustomerAccountBalances as any);

// --- PURCHASE REPORTS ---
router.get('/purchases/aging', reportsController.getPurchaseAging as any);
router.get('/purchases/billwise', reportsController.getPurchasesBillwise as any);
router.get('/purchases/itemwise', reportsController.getPurchasesItemwise as any);
router.get('/purchases/billwise-summary', reportsController.getPurchasesBillwiseSummary as any);
router.get('/purchases/itemwise-summary', reportsController.getPurchasesItemwiseSummary as any);
router.get('/purchases/supplierwise-summary', reportsController.getPurchasesSupplierwise as any);
router.get('/purchases/gst', reportsController.getPurchasesGST as any);

// --- SUPPLIER REPORTS ---
router.get('/suppliers/account-balances', reportsController.getSupplierAccountBalances as any);
router.get('/suppliers/payment-history', reportsController.getSupplierPaymentHistory as any);

// --- EXPENSE REPORTS ---
router.get('/expenses/search', reportsController.getExpensesSearch as any);
router.get('/expenses/indirect', reportsController.getIndirectExpenses as any);

// --- EXTENDED GSTR ---
router.get('/gstr/gstr1', reportsController.getGSTR1 as any);
router.get('/gstr/gstr3b', reportsController.getGSTR3B as any);

// --- DASHBOARD ANALYTICS ---
router.get('/dashboard/business-trend', reportsController.getDashboardBusinessTrend as any);
router.get('/dashboard/inventory-volume', reportsController.getDashboardInventoryVolume as any);
router.get('/dashboard/top-items-profit', reportsController.getDashboardTopItemsProfit as any);
router.get('/dashboard/stock-movement', reportsController.getDashboardStockMovement as any);
router.get('/dashboard/top-customers', reportsController.getDashboardTopCustomers as any);
router.get('/dashboard/customer-pending', reportsController.getDashboardCustomerPending as any);
router.get('/dashboard/supplier-pending', reportsController.getDashboardSupplierPending as any);

export default router;

