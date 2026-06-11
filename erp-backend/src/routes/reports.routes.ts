import express from 'express';
import * as reportsController from '../controllers/reports.controller';
import * as advancedReportsController from '../controllers/reports.advanced.controller';
import * as specialReportsController from '../controllers/reports.special.controller';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';

const router = express.Router();
router.use(protect);
router.use(checkLockedFY);
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

// --- ADVANCED FINANCIAL REPORTS ---
router.get('/advanced/trial-balance', advancedReportsController.getTrialBalance as any);
router.get('/advanced/general-ledger', advancedReportsController.getGeneralLedger as any);
router.get('/advanced/bank-book', advancedReportsController.getBankBook as any);
router.get('/advanced/bank-reconciliation', advancedReportsController.getBankReconciliation as any);
router.get('/advanced/cash-flow', advancedReportsController.getCashFlowStatement as any);
router.get('/advanced/outstanding-receivables', advancedReportsController.getOutstandingReceivables as any);
router.get('/advanced/outstanding-payables', advancedReportsController.getOutstandingPayables as any);

// --- ADVANCED INVENTORY REPORTS ---
router.get('/advanced/inventory-valuation', advancedReportsController.getInventoryValuation as any);
router.get('/advanced/stock-movement', advancedReportsController.getStockMovement as any);
router.get('/advanced/warehouse-stock', advancedReportsController.getWarehouseWiseStock as any);
router.get('/advanced/expiry-items', advancedReportsController.getExpiryItems as any);
router.get('/advanced/dead-stock-advanced', advancedReportsController.getDeadStock as any);

// --- ADVANCED SALES & PURCHASE REPORTS ---
router.get('/advanced/salesperson-performance', advancedReportsController.getSalespersonPerformance as any);
router.get('/advanced/sales-trend', advancedReportsController.getSalesTrend as any);
router.get('/advanced/top-customers-advanced', advancedReportsController.getTopCustomersAdvanced as any);
router.get('/advanced/top-selling-products', advancedReportsController.getTopSellingProducts as any);
router.get('/advanced/supplier-performance', advancedReportsController.getSupplierPerformance as any);
router.get('/advanced/purchase-trend', advancedReportsController.getPurchaseTrend as any);

// --- COMPLIANCE & MANAGEMENT REPORTS ---
router.get('/advanced/gst-audit', advancedReportsController.getGSTAudit as any);
router.get('/advanced/e-invoice-register', advancedReportsController.getEInvoiceRegister as any);
router.get('/advanced/eway-bill-register', advancedReportsController.getEwayBillRegister as any);
router.get('/advanced/business-dashboard-advanced', advancedReportsController.getBusinessDashboardAdvanced as any);
router.get('/advanced/profitability-analysis', advancedReportsController.getProfitabilityAnalysis as any);
router.get('/advanced/budget-vs-actual', advancedReportsController.getBudgetVsActual as any);
router.get('/advanced/audit-trail', advancedReportsController.getAuditTrail as any);

// --- SPECIAL REPORTS ---
router.get('/special/inventory-wise-customer-summary', specialReportsController.getInventoryWiseCustomerSummary as any);
router.get('/special/inventory-wise-supplier-summary', specialReportsController.getInventoryWiseSupplierSummary as any);
router.get('/special/supplier-wise-bill-summary', specialReportsController.getSupplierWiseBillSummary as any);
router.get('/special/group-wise-profit-loss', specialReportsController.getGroupWiseProfitAndLoss as any);
router.get('/special/category-wise-summary', specialReportsController.getCategoryWiseSummary as any);
router.get('/special/category-wise-profit-loss', specialReportsController.getCategoryWiseProfitAndLoss as any);
router.get('/special/category-wise-sales', specialReportsController.getCategoryWiseSales as any);
router.get('/special/category-wise-margin', specialReportsController.getCategoryWiseMargin as any);
router.get('/special/category-wise-supplier-analysis', specialReportsController.getCategoryWiseSupplierAnalysis as any);
router.get('/special/abc-analysis', specialReportsController.getAbcAnalysis as any);
router.get('/special/inventory-turnover-ratio', specialReportsController.getInventoryTurnoverRatio as any);
router.get('/special/gross-profit-pct', specialReportsController.getGrossProfitPct as any);
router.get('/special/net-profit-pct', specialReportsController.getNetProfitPct as any);
router.get('/special/customer-lifetime-value', specialReportsController.getCustomerLifetimeValue as any);
router.get('/special/repeat-customer-report', specialReportsController.getRepeatCustomerReport as any);
router.get('/special/top-100-products', specialReportsController.getTop100Products as any);
router.get('/special/bottom-100-products', specialReportsController.getBottom100Products as any);
router.get('/special/seasonal-analysis', specialReportsController.getSeasonalAnalysis as any);
router.get('/special/dead-stock-recovery', specialReportsController.getDeadStockRecovery as any);
router.get('/special/forecast-purchase-planning', specialReportsController.getForecastPurchasePlanning as any);
router.get('/special/forecast-sales-planning', specialReportsController.getForecastSalesPlanning as any);

export default router;

