import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import mongoose from 'mongoose';
import Invoice from '../models/Invoice.model';
import PurchaseBill from '../models/PurchaseBill.model';

// --- HELPER FUNCTION TO GET PRODUCTS ---
const getProductsMap = async (businessId: mongoose.Types.ObjectId) => {
  const products = await mongoose.model('Product').find({ businessId }).lean();
  const map = new Map<string, any>();
  products.forEach((p: any) => {
    map.set(p._id.toString(), p);
  });
  return map;
};

// 1. INVENTORY WISE CUSTOMER SUMMARY
export const getInventoryWiseCustomerSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>(); // key: itemId_customerId

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString() || 'Cash';
      const cname = inv.customerSnapshot?.name || 'Cash Customer';
      
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString() || 'Misc';
        const key = `${pid}_${cid}`;
        
        if (!map.has(key)) {
          map.set(key, {
            itemId: pid,
            itemCode: (item as any).productCode || '-',
            itemName: item.productName || 'Unknown Item',
            customerName: cname,
            quantitySold: 0,
            salesValue: 0,
            lastPurchaseDate: inv.invoiceDate
          });
        }
        const m = map.get(key);
        m.quantitySold += item.quantity;
        m.salesValue += item.totalAmount;
        if (new Date(inv.invoiceDate) > new Date(m.lastPurchaseDate)) {
          m.lastPurchaseDate = inv.invoiceDate;
        }
      });
    });

    const data = Array.from(map.values()).map(m => ({
      ...m,
      averageSellingPrice: m.quantitySold > 0 ? m.salesValue / m.quantitySold : 0
    })).sort((a, b) => b.salesValue - a.salesValue);

    let totalItemsSold = 0;
    let totalRevenue = 0;
    const uniqueCustomers = new Set();

    data.forEach(d => {
      totalItemsSold += d.quantitySold;
      totalRevenue += d.salesValue;
      uniqueCustomers.add(d.customerName);
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItemsSold,
          totalCustomers: uniqueCustomers.size,
          totalRevenue,
          averageRevenuePerCustomer: uniqueCustomers.size > 0 ? totalRevenue / uniqueCustomers.size : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 2. INVENTORY WISE SUPPLIER SUMMARY
export const getInventoryWiseSupplierSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>();

    bills.forEach(bill => {
      const sid = bill.supplierId?.toString() || 'Cash';
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';

      bill.lineItems?.forEach(item => {
        const pid = item.productId?.toString() || 'Misc';
        const key = `${pid}_${sid}`;

        if (!map.has(key)) {
          map.set(key, {
            itemCode: (item as any).productCode || '-',
            itemName: item.productName || 'Unknown Item',
            supplierName: sname,
            quantityPurchased: 0,
            purchaseValue: 0,
            lastPurchaseDate: bill.billDate
          });
        }
        const m = map.get(key);
        m.quantityPurchased += item.quantity;
        m.purchaseValue += item.totalAmount;
        if (new Date(bill.billDate) > new Date(m.lastPurchaseDate)) {
          m.lastPurchaseDate = bill.billDate;
        }
      });
    });

    const data = Array.from(map.values()).map(m => ({
      ...m,
      averageCost: m.quantityPurchased > 0 ? m.purchaseValue / m.quantityPurchased : 0
    })).sort((a, b) => b.purchaseValue - a.purchaseValue);

    const uniqueItems = new Set();
    const uniqueSuppliers = new Set();
    let totalPurchaseValue = 0;
    let totalQty = 0;

    data.forEach(d => {
      uniqueItems.add(d.itemCode);
      uniqueSuppliers.add(d.supplierName);
      totalPurchaseValue += d.purchaseValue;
      totalQty += d.quantityPurchased;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalInventoryItems: uniqueItems.size,
          totalSuppliers: uniqueSuppliers.size,
          totalPurchaseValue,
          averagePurchaseCost: totalQty > 0 ? totalPurchaseValue / totalQty : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 3. SUPPLIER WISE BILL SUMMARY
export const getSupplierWiseBillSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>();

    bills.forEach(bill => {
      const sid = bill.supplierId?.toString() || 'Cash';
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';

      if (!map.has(sid)) {
        map.set(sid, {
          supplierName: sname,
          numberOfBills: 0,
          purchaseValue: 0,
          taxAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          lastBillDate: bill.billDate
        });
      }
      const m = map.get(sid);
      m.numberOfBills++;
      m.purchaseValue += bill.grandTotal;
      m.taxAmount += bill.totalGST || 0;
      m.paidAmount += bill.amountPaid || 0;
      m.outstandingAmount += bill.balance || 0;
      if (new Date(bill.billDate) > new Date(m.lastBillDate)) {
        m.lastBillDate = bill.billDate;
      }
    });

    const data = Array.from(map.values()).sort((a, b) => b.purchaseValue - a.purchaseValue);

    let totalPurchaseValue = 0;
    let outstandingPayables = 0;

    data.forEach(d => {
      totalPurchaseValue += d.purchaseValue;
      outstandingPayables += d.outstandingAmount;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSuppliers: data.length,
          totalBills: bills.length,
          totalPurchaseValue,
          outstandingPayables
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 4. GROUP WISE PROFIT & LOSS
export const getGroupWiseProfitAndLoss = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const product = pid ? productsMap.get(pid) : null;
        const groupName = product?.group || 'Uncategorized';

        if (!map.has(groupName)) {
          map.set(groupName, { groupName, revenue: 0, cost: 0 });
        }
        const m = map.get(groupName);
        m.revenue += item.totalAmount;
        const unitCost = product?.purchasePrice || (item.rate * 0.8); // fallback
        m.cost += unitCost * item.quantity;
      });
    });

    let totalRevenue = 0;
    let totalCost = 0;

    let data = Array.from(map.values()).map(m => {
      totalRevenue += m.revenue;
      totalCost += m.cost;
      const gp = m.revenue - m.cost;
      return {
        ...m,
        grossProfit: gp,
        marginPct: m.revenue > 0 ? (gp / m.revenue) * 100 : 0
      };
    }).sort((a, b) => b.grossProfit - a.grossProfit);

    data = data.map(d => ({
      ...d,
      contributionPct: totalRevenue > 0 ? (d.revenue / totalRevenue) * 100 : 0
    }));

    const totalGrossProfit = totalRevenue - totalCost;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          grossProfit: totalGrossProfit,
          netMarginPct: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 5. CATEGORY WISE SUMMARY
export const getCategoryWiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const [invoices, bills, products] = await Promise.all([
      Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean(),
      PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean(),
      mongoose.model('Product').find({ businessId }).lean()
    ]);

    const map = new Map<string, any>(); // key: category
    const productsMap = new Map<string, any>();

    products.forEach((p: any) => {
      const cat = p.category || 'Uncategorized';
      if (!map.has(cat)) {
        map.set(cat, { category: cat, itemsCount: 0, salesQuantity: 0, revenue: 0, purchaseValue: 0, inventoryValue: 0 });
      }
      const m = map.get(cat);
      m.itemsCount++;
      m.inventoryValue += (p.currentStock || 0) * (p.purchasePrice || 0);
      productsMap.set(p._id.toString(), cat);
    });

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const cat = pid && productsMap.has(pid) ? productsMap.get(pid) : 'Uncategorized';
        if (!map.has(cat)) map.set(cat, { category: cat, itemsCount: 0, salesQuantity: 0, revenue: 0, purchaseValue: 0, inventoryValue: 0 });
        const m = map.get(cat);
        m.salesQuantity += item.quantity;
        m.revenue += item.totalAmount;
      });
    });

    bills.forEach(bill => {
      bill.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const cat = pid && productsMap.has(pid) ? productsMap.get(pid) : 'Uncategorized';
        if (!map.has(cat)) map.set(cat, { category: cat, itemsCount: 0, salesQuantity: 0, revenue: 0, purchaseValue: 0, inventoryValue: 0 });
        const m = map.get(cat);
        m.purchaseValue += item.totalAmount;
      });
    });

    const data = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);

    let totalRev = 0, totalPur = 0, totalInv = 0;
    data.forEach(d => { totalRev += d.revenue; totalPur += d.purchaseValue; totalInv += d.inventoryValue; });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCategories: data.length,
          revenue: totalRev,
          purchases: totalPur,
          inventoryValue: totalInv
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 6. CATEGORY WISE PROFIT & LOSS
export const getCategoryWiseProfitAndLoss = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const product = pid ? productsMap.get(pid) : null;
        const cat = product?.category || 'Uncategorized';

        if (!map.has(cat)) map.set(cat, { category: cat, revenue: 0, cost: 0 });
        
        const m = map.get(cat);
        m.revenue += item.totalAmount;
        const unitCost = product?.purchasePrice || (item.rate * 0.8);
        m.cost += unitCost * item.quantity;
      });
    });

    let totalRevenue = 0, totalCost = 0;

    const data = Array.from(map.values()).map(m => {
      totalRevenue += m.revenue;
      totalCost += m.cost;
      const gp = m.revenue - m.cost;
      return {
        ...m,
        grossProfit: gp,
        marginPct: m.revenue > 0 ? (gp / m.revenue) * 100 : 0
      };
    }).sort((a, b) => b.grossProfit - a.grossProfit);

    const totalProfit = totalRevenue - totalCost;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          marginPct: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 7. CATEGORY WISE SALES
export const getCategoryWiseSales = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      const invCategories = new Set<string>(); // To track unique orders per category
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const product = pid ? productsMap.get(pid) : null;
        const cat = product?.category || 'Uncategorized';

        if (!map.has(cat)) map.set(cat, { category: cat, quantitySold: 0, revenue: 0, ordersCount: 0 });
        
        const m = map.get(cat);
        m.quantitySold += item.quantity;
        m.revenue += item.totalAmount;
        
        if (!invCategories.has(cat)) {
          invCategories.add(cat);
          m.ordersCount++;
        }
      });
    });

    let totalSales = 0, totalQty = 0;

    const data = Array.from(map.values()).map(m => {
      totalSales += m.revenue;
      totalQty += m.quantitySold;
      return {
        ...m,
        averageSellingPrice: m.quantitySold > 0 ? m.revenue / m.quantitySold : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalQuantitySold: totalQty,
          topCategory: data.length > 0 ? data[0].category : '-',
          averageCategoryRevenue: data.length > 0 ? totalSales / data.length : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 8. CATEGORY WISE MARGIN
export const getCategoryWiseMargin = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const product = pid ? productsMap.get(pid) : null;
        const cat = product?.category || 'Uncategorized';

        if (!map.has(cat)) map.set(cat, { category: cat, revenue: 0, cost: 0 });
        const m = map.get(cat);
        m.revenue += item.totalAmount;
        m.cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });
    });

    let totalGrossProfit = 0, totalRevenue = 0;

    const data = Array.from(map.values()).map(m => {
      const gp = m.revenue - m.cost;
      totalGrossProfit += gp;
      totalRevenue += m.revenue;
      return {
        ...m,
        grossProfit: gp,
        marginPct: m.revenue > 0 ? (gp / m.revenue) * 100 : 0
      };
    }).sort((a, b) => b.marginPct - a.marginPct); // Sort by highest margin %

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalMargin: totalGrossProfit,
          averageMarginPct: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
          highestMarginCategory: data.length > 0 ? data[0].category : '-',
          lowestMarginCategory: data.length > 0 ? data[data.length - 1].category : '-'
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 9. CATEGORY WISE SUPPLIER ANALYSIS
export const getCategoryWiseSupplierAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    bills.forEach(bill => {
      const sid = bill.supplierId?.toString() || 'Cash';
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';

      bill.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const product = pid ? productsMap.get(pid) : null;
        const cat = product?.category || 'Uncategorized';
        const key = `${cat}_${sid}`;

        if (!map.has(key)) {
          map.set(key, { category: cat, supplierName: sname, purchaseValue: 0, quantityPurchased: 0 });
        }
        const m = map.get(key);
        m.purchaseValue += item.totalAmount;
        m.quantityPurchased += item.quantity;
      });
    });

    const categoryTotals = new Map<string, number>();
    Array.from(map.values()).forEach(m => {
      categoryTotals.set(m.category, (categoryTotals.get(m.category) || 0) + m.purchaseValue);
    });

    let totalPurchaseValue = 0;
    const uniqueSuppliers = new Set();

    const data = Array.from(map.values()).map(m => {
      totalPurchaseValue += m.purchaseValue;
      uniqueSuppliers.add(m.supplierName);
      const catTotal = categoryTotals.get(m.category) || 1;
      return {
        ...m,
        averageCost: m.quantityPurchased > 0 ? m.purchaseValue / m.quantityPurchased : 0,
        contributionPct: (m.purchaseValue / catTotal) * 100
      };
    }).sort((a, b) => b.purchaseValue - a.purchaseValue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSuppliers: uniqueSuppliers.size,
          categoriesCovered: categoryTotals.size,
          purchaseValue: totalPurchaseValue,
          supplierDiversity: uniqueSuppliers.size > 0 ? (categoryTotals.size / uniqueSuppliers.size).toFixed(2) : '0'
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 10. ABC ANALYSIS (TOP SELLING PRODUCTS)
export const getAbcAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();
    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        if (!map.has(pid)) {
          const product = productsMap.get(pid);
          map.set(pid, {
            itemCode: (item as any).productCode || product?.itemCode || '-',
            itemName: item.productName || product?.name || 'Unknown',
            revenue: 0,
            quantity: 0
          });
        }
        const m = map.get(pid);
        m.revenue += item.totalAmount;
        m.quantity += item.quantity;
      });
    });

    let data = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    let totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

    let cumulativeRevenue = 0;
    data = data.map(d => {
      cumulativeRevenue += d.revenue;
      const cumulativePct = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;
      const contributionPct = totalRevenue > 0 ? (d.revenue / totalRevenue) * 100 : 0;
      
      let classification = 'C';
      if (cumulativePct <= 70) classification = 'A';
      else if (cumulativePct <= 90) classification = 'B';

      return { ...d, contributionPct, cumulativePct, classification };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts: data.length,
          totalRevenue,
          aClassCount: data.filter(d => d.classification === 'A').length,
          bClassCount: data.filter(d => d.classification === 'B').length
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 11. INVENTORY TURNOVER RATIO
export const getInventoryTurnoverRatio = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    // Calculate COGS per product from sales
    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        if (!map.has(pid)) {
          const product = productsMap.get(pid);
          map.set(pid, {
            itemCode: (item as any).productCode || product?.itemCode || '-',
            itemName: item.productName || product?.name || 'Unknown',
            cogs: 0,
            avgInventoryValue: (product?.currentStock || 0) * (product?.purchasePrice || 0)
          });
        }
        const m = map.get(pid);
        const product = productsMap.get(pid);
        const cost = product?.purchasePrice || (item.rate * 0.8); // fallback to 80% of rate
        m.cogs += cost * item.quantity;
      });
    });

    let totalCogs = 0;
    let totalAvgInv = 0;

    const data = Array.from(map.values()).map(m => {
      totalCogs += m.cogs;
      totalAvgInv += m.avgInventoryValue;
      const ratio = m.avgInventoryValue > 0 ? m.cogs / m.avgInventoryValue : m.cogs;
      return {
        ...m,
        turnoverRatio: ratio,
        inventoryDays: ratio > 0 ? 365 / ratio : 0
      };
    }).sort((a, b) => b.turnoverRatio - a.turnoverRatio);

    const overallRatio = totalAvgInv > 0 ? totalCogs / totalAvgInv : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          averageInventory: totalAvgInv,
          cogs: totalCogs,
          turnoverRatio: overallRatio,
          inventoryDays: overallRatio > 0 ? 365 / overallRatio : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 12. GROSS PROFIT %
export const getGrossProfitPct = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        if (!map.has(pid)) {
          const product = productsMap.get(pid);
          map.set(pid, {
            itemCode: (item as any).productCode || product?.itemCode || '-',
            itemName: item.productName || product?.name || 'Unknown',
            revenue: 0,
            cost: 0
          });
        }
        const m = map.get(pid);
        m.revenue += item.totalAmount;
        const product = productsMap.get(pid);
        const cost = product?.purchasePrice || (item.rate * 0.8);
        m.cost += cost * item.quantity;
      });
    });

    let totalRevenue = 0, totalCost = 0;
    const data = Array.from(map.values()).map(m => {
      totalRevenue += m.revenue;
      totalCost += m.cost;
      const gp = m.revenue - m.cost;
      return {
        ...m,
        grossProfit: gp,
        grossProfitPct: m.revenue > 0 ? (gp / m.revenue) * 100 : 0
      };
    }).sort((a, b) => b.grossProfitPct - a.grossProfitPct);

    const totalGp = totalRevenue - totalCost;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRevenue,
          cost: totalCost,
          grossProfit: totalGp,
          grossProfitPct: totalRevenue > 0 ? (totalGp / totalRevenue) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 13. NET PROFIT %
export const getNetProfitPct = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // We need total revenue, total COGS, and total expenses (indirect).
    // For item breakdown, we can distribute indirect expenses proportionally by revenue.
    const [invoices, expenses] = await Promise.all([
      Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean(),
      mongoose.model('Expense').find({ businessId }).lean()
    ]);
    const productsMap = await getProductsMap(businessId);

    let totalExpenses = 0;
    expenses.forEach((e: any) => totalExpenses += (e.totalAmount || 0));

    const map = new Map<string, any>();
    let totalRevenue = 0, totalCost = 0;

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        if (!map.has(pid)) {
          const product = productsMap.get(pid);
          map.set(pid, {
            itemCode: (item as any).productCode || product?.itemCode || '-',
            itemName: item.productName || product?.name || 'Unknown',
            revenue: 0,
            cogs: 0
          });
        }
        const m = map.get(pid);
        m.revenue += item.totalAmount;
        const product = productsMap.get(pid);
        const cost = product?.purchasePrice || (item.rate * 0.8);
        m.cogs += cost * item.quantity;
        
        totalRevenue += item.totalAmount;
        totalCost += cost * item.quantity;
      });
    });

    const data = Array.from(map.values()).map(m => {
      // Pro-rata indirect expense distribution based on revenue
      const allocatedExpense = totalRevenue > 0 ? (m.revenue / totalRevenue) * totalExpenses : 0;
      const totalExpensesForItem = m.cogs + allocatedExpense;
      const netProfit = m.revenue - totalExpensesForItem;
      
      return {
        ...m,
        expenses: totalExpensesForItem,
        netProfit: netProfit,
        netProfitPct: m.revenue > 0 ? (netProfit / m.revenue) * 100 : 0
      };
    }).sort((a, b) => b.netProfit - a.netProfit);

    const overallNet = totalRevenue - (totalCost + totalExpenses);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRevenue,
          expenses: totalCost + totalExpenses,
          netProfit: overallNet,
          netProfitPct: totalRevenue > 0 ? (overallNet / totalRevenue) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 14. CUSTOMER LIFETIME VALUE (CLV)
export const getCustomerLifetimeValue = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString() || 'Cash';
      const cname = inv.customerSnapshot?.name || 'Cash Customer';

      if (!map.has(cid)) {
        map.set(cid, {
          customerName: cname,
          totalRevenue: 0,
          ordersCount: 0,
          firstOrderDate: inv.invoiceDate,
          lastOrderDate: inv.invoiceDate
        });
      }
      const m = map.get(cid);
      m.totalRevenue += inv.grandTotal;
      m.ordersCount++;
      if (new Date(inv.invoiceDate) < new Date(m.firstOrderDate)) m.firstOrderDate = inv.invoiceDate;
      if (new Date(inv.invoiceDate) > new Date(m.lastOrderDate)) m.lastOrderDate = inv.invoiceDate;
    });

    let grandTotalRevenue = 0, grandTotalOrders = 0;

    const data = Array.from(map.values()).map(m => {
      grandTotalRevenue += m.totalRevenue;
      grandTotalOrders += m.ordersCount;
      const aov = m.ordersCount > 0 ? m.totalRevenue / m.ordersCount : 0;
      
      // Basic CLV: Average Order Value * Number of Orders (historical lifetime)
      const clv = aov * m.ordersCount; 

      return {
        ...m,
        averageOrderValue: aov,
        clv: clv
      };
    }).sort((a, b) => b.clv - a.clv);

    const totalCustomers = data.length;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          avgClv: totalCustomers > 0 ? grandTotalRevenue / totalCustomers : 0,
          avgOrdersCount: totalCustomers > 0 ? grandTotalOrders / totalCustomers : 0,
          avgOrderValue: grandTotalOrders > 0 ? grandTotalRevenue / grandTotalOrders : 0,
          totalCustomers
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 15. REPEAT CUSTOMER REPORT
export const getRepeatCustomerReport = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString() || 'Cash';
      const cname = inv.customerSnapshot?.name || 'Cash Customer';

      if (!map.has(cid)) {
        map.set(cid, {
          customerName: cname,
          ordersCount: 0,
          totalRevenue: 0,
          firstPurchase: inv.invoiceDate,
          latestPurchase: inv.invoiceDate
        });
      }
      const m = map.get(cid);
      m.ordersCount++;
      m.totalRevenue += inv.grandTotal;
      if (new Date(inv.invoiceDate) < new Date(m.firstPurchase)) m.firstPurchase = inv.invoiceDate;
      if (new Date(inv.invoiceDate) > new Date(m.latestPurchase)) m.latestPurchase = inv.invoiceDate;
    });

    let totalCustomers = 0, repeatCustomers = 0, repeatRevenue = 0, totalRevenue = 0;

    const data = Array.from(map.values())
      .filter(m => m.ordersCount > 1) // Only Repeat
      .map(m => {
        const daysDiff = (new Date(m.latestPurchase).getTime() - new Date(m.firstPurchase).getTime()) / (1000 * 3600 * 24);
        const freq = daysDiff > 0 ? daysDiff / m.ordersCount : 0;
        return {
          ...m,
          purchaseFrequency: freq // Days between purchases
        };
      })
      .sort((a, b) => b.ordersCount - a.ordersCount);

    Array.from(map.values()).forEach(m => {
      totalCustomers++;
      totalRevenue += m.totalRevenue;
      if (m.ordersCount > 1) {
        repeatCustomers++;
        repeatRevenue += m.totalRevenue;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          repeatCustomers,
          retentionRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
          repeatRevenuePct: totalRevenue > 0 ? (repeatRevenue / totalRevenue) * 100 : 0,
          totalRepeatRevenue: repeatRevenue
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 16. TOP 100 PRODUCTS
export const getTop100Products = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        if (!map.has(pid)) {
          const product = productsMap.get(pid);
          map.set(pid, {
            itemCode: (item as any).productCode || product?.itemCode || '-',
            itemName: item.productName || product?.name || 'Unknown',
            revenue: 0,
            quantitySold: 0,
            cost: 0
          });
        }
        const m = map.get(pid);
        m.revenue += item.totalAmount;
        m.quantitySold += item.quantity;
        const product = productsMap.get(pid);
        m.cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });
    });

    let totalRev = 0;
    const data = Array.from(map.values()).map(m => {
      const profit = m.revenue - m.cost;
      totalRev += m.revenue;
      return {
        ...m,
        profit,
        marginPct: m.revenue > 0 ? (profit / m.revenue) * 100 : 0
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 100);

    const top100Rev = data.reduce((sum, d) => sum + d.revenue, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          top100Revenue: top100Rev,
          contributionPct: totalRev > 0 ? (top100Rev / totalRev) * 100 : 0,
          averageMargin: data.length > 0 ? data.reduce((s, d) => s + d.marginPct, 0) / data.length : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 17. BOTTOM 100 PRODUCTS
export const getBottom100Products = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        if (!map.has(pid)) {
          const product = productsMap.get(pid);
          map.set(pid, {
            itemCode: (item as any).productCode || product?.itemCode || '-',
            itemName: item.productName || product?.name || 'Unknown',
            revenue: 0,
            quantitySold: 0,
            cost: 0,
            lastSoldDate: inv.invoiceDate
          });
        }
        const m = map.get(pid);
        m.revenue += item.totalAmount;
        m.quantitySold += item.quantity;
        const product = productsMap.get(pid);
        m.cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
        if (new Date(inv.invoiceDate) > new Date(m.lastSoldDate)) m.lastSoldDate = inv.invoiceDate;
      });
    });

    const data = Array.from(map.values()).map(m => {
      const profit = m.revenue - m.cost;
      return {
        ...m,
        profit,
      };
    }).sort((a, b) => a.revenue - b.revenue).slice(0, 100);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          bottom100Revenue: data.reduce((s, d) => s + d.revenue, 0),
          averageBottomSales: data.length > 0 ? data.reduce((s, d) => s + d.revenue, 0) / data.length : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 18. SEASONAL PRODUCT ANALYSIS
export const getSeasonalAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>(); // group by YYYY-MM

    let overallTotal = 0;
    
    invoices.forEach(inv => {
      const date = new Date(inv.invoiceDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!map.has(monthYear)) {
        map.set(monthYear, { month: monthYear, seasonalRevenue: 0, monthlyDemand: 0 });
      }
      const m = map.get(monthYear);
      m.seasonalRevenue += inv.grandTotal;
      m.monthlyDemand += (inv.lineItems?.reduce((s, i) => s + i.quantity, 0) || 0);
      overallTotal += inv.grandTotal;
    });

    const avgRevenue = overallTotal / (map.size || 1);

    const data = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).map((m, index, arr) => {
      const prev = index > 0 ? arr[index - 1].seasonalRevenue : m.seasonalRevenue;
      const growthRate = prev > 0 ? ((m.seasonalRevenue - prev) / prev) * 100 : 0;
      const seasonalIndex = avgRevenue > 0 ? (m.seasonalRevenue / avgRevenue) : 1;

      return {
        ...m,
        growthRate,
        seasonalIndex
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          peakMonth: data.length > 0 ? data.reduce((max, d) => d.seasonalRevenue > max.seasonalRevenue ? d : max).month : '-',
          avgMonthlyRevenue: avgRevenue,
          highestIndex: data.length > 0 ? Math.max(...data.map(d => d.seasonalIndex)) : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 19. DEAD STOCK RECOVERY REPORT
export const getDeadStockRecovery = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const products = await mongoose.model('Product').find({ businessId }).lean();

    const lastSoldMap = new Map<string, Date>();
    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        const d = new Date(inv.invoiceDate);
        if (!lastSoldMap.has(pid) || d > lastSoldMap.get(pid)!) {
          lastSoldMap.set(pid, d);
        }
      });
    });

    const now = new Date();
    const DEAD_STOCK_DAYS = 90;

    const data = products
      .filter((p: any) => (p.currentStock || 0) > 0)
      .map((p: any) => {
        const lastSold = lastSoldMap.get(p._id.toString());
        const daysSinceSold = lastSold ? (now.getTime() - lastSold.getTime()) / (1000 * 3600 * 24) : 999;
        
        let action = 'Hold';
        if (daysSinceSold > 180) action = 'Liquidation';
        else if (daysSinceSold > 120) action = 'Bundle';
        else if (daysSinceSold > 90) action = 'Discount';

        return {
          itemCode: p.itemCode || '-',
          itemName: p.name,
          unsoldDays: Math.floor(daysSinceSold),
          deadStockValue: (p.currentStock || 0) * (p.purchasePrice || 0),
          recoveryPotential: (p.currentStock || 0) * (p.salesPrice || 0),
          recommendedAction: action
        };
      })
      .filter(d => d.unsoldDays >= DEAD_STOCK_DAYS)
      .sort((a, b) => b.deadStockValue - a.deadStockValue);

    const totalDeadValue = data.reduce((s, d) => s + d.deadStockValue, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          deadItemsCount: data.length,
          totalDeadValue,
          maxUnsoldDays: data.length > 0 ? Math.max(...data.map(d => d.unsoldDays)) : 0,
          potentialRecovery: data.reduce((s, d) => s + d.recoveryPotential, 0)
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 20. FORECAST PURCHASE PLANNING
export const getForecastPurchasePlanning = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Calculate last 30 days daily run rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const invoices = await Invoice.find({ businessId, invoiceDate: { $gte: thirtyDaysAgo }, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const runRateMap = new Map<string, number>();
    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        runRateMap.set(pid, (runRateMap.get(pid) || 0) + item.quantity);
      });
    });

    const LEAD_TIME_DAYS = 15; // Assume 15 days lead time
    const FORECAST_DAYS = 30;  // Plan for next 30 days

    let totalReorderValue = 0;
    
    const data = Array.from(productsMap.values()).map(product => {
      const past30Qty = runRateMap.get(product._id.toString()) || 0;
      const dailyRunRate = past30Qty / 30;
      
      const forecastDemand = dailyRunRate * FORECAST_DAYS;
      const leadTimeDemand = dailyRunRate * LEAD_TIME_DAYS;
      const reorderPoint = leadTimeDemand + (dailyRunRate * 5); // 5 days safety
      const currentStock = product.currentStock || 0;
      
      let recommendedQty = 0;
      if (currentStock < reorderPoint) {
        recommendedQty = Math.ceil(forecastDemand + reorderPoint - currentStock);
      }

      const stockoutRisk = currentStock < leadTimeDemand ? 'High' : (currentStock < reorderPoint ? 'Medium' : 'Low');
      
      const reqValue = recommendedQty * (product.purchasePrice || 0);
      totalReorderValue += reqValue;

      return {
        itemCode: product.itemCode || '-',
        itemName: product.name,
        forecastDemand: Math.ceil(forecastDemand),
        recommendedPurchaseQty: recommendedQty,
        stockoutRisk,
        reorderRequirementValue: reqValue
      };
    }).filter(d => d.recommendedPurchaseQty > 0).sort((a, b) => b.reorderRequirementValue - a.reorderRequirementValue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          itemsToReorder: data.length,
          totalReorderValue,
          highRiskItems: data.filter(d => d.stockoutRisk === 'High').length
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 21. FORECAST SALES PLANNING
export const getForecastSalesPlanning = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    // Group by month
    const monthlyMap = new Map<string, { revenue: number, qty: number }>();
    
    invoices.forEach(inv => {
      const date = new Date(inv.invoiceDate);
      const mYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(mYear)) monthlyMap.set(mYear, { revenue: 0, qty: 0 });
      const m = monthlyMap.get(mYear)!;
      m.revenue += inv.grandTotal;
      m.qty += (inv.lineItems?.reduce((s, i) => s + i.quantity, 0) || 0);
    });

    const sortedMonths = Array.from(monthlyMap.keys()).sort();
    
    // We will list the historical months and add a "+1" forecast row using 3-month moving average
    const data = sortedMonths.map((m, i, arr) => {
      const curr = monthlyMap.get(m)!;
      const prev = i > 0 ? monthlyMap.get(arr[i - 1])!.revenue : curr.revenue;
      const growth = prev > 0 ? ((curr.revenue - prev) / prev) * 100 : 0;
      
      return {
        month: m,
        revenue: curr.revenue,
        quantity: curr.qty,
        growthPct: growth,
        type: 'Historical'
      };
    });

    // Forecast calculation
    let forecastRev = 0, forecastQty = 0;
    const last3 = data.slice(-3);
    if (last3.length > 0) {
      forecastRev = last3.reduce((s, d) => s + d.revenue, 0) / last3.length;
      forecastQty = last3.reduce((s, d) => s + d.quantity, 0) / last3.length;
    }

    const lastMonthRev = data.length > 0 ? data[data.length - 1].revenue : forecastRev;
    const forecastGrowth = lastMonthRev > 0 ? ((forecastRev - lastMonthRev) / lastMonthRev) * 100 : 0;

    data.push({
      month: 'Next Month (Forecast)',
      revenue: forecastRev,
      quantity: forecastQty,
      growthPct: forecastGrowth,
      type: 'Forecast'
    });

    // Re-map to match the requested table columns
    const finalData = data.map(d => ({
      month: d.month,
      forecastRevenue: d.revenue,
      forecastQuantity: Math.ceil(d.quantity),
      growthPct: d.growthPct,
      salesTargets: d.type === 'Forecast' ? d.revenue * 1.1 : 0 // Suggest 10% higher for target
    })).reverse(); // show latest/forecast first

    res.status(200).json({
      success: true,
      data: {
        summary: {
          nextMonthForecastRev: forecastRev,
          projectedGrowth: forecastGrowth,
          recommendedTarget: forecastRev * 1.1,
          forecastMethod: '3-Month Moving Average'
        },
        data: finalData
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// --- PHASE 3: CUSTOMER ANALYTICS REPORTS ---

// 22. CITY WISE CUSTOMER REPORT
export const getCityWiseCustomerReport = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const [invoices, customers] = await Promise.all([
      Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean(),
      mongoose.model('Customer').find({ businessId }).lean()
    ]);

    const customerMap = new Map<string, any>();
    customers.forEach((c: any) => {
      customerMap.set(c._id.toString(), c);
    });

    const map = new Map<string, any>(); // group by city

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString();
      const customer = cid ? customerMap.get(cid) : null;
      const city = customer?.address?.city || customer?.city || customer?.billingAddress?.city || 'Unknown';

      if (!map.has(city)) {
        map.set(city, {
          city,
          customers: new Set<string>(),
          ordersCount: 0,
          revenue: 0,
          outstandingAmount: 0
        });
      }
      const m = map.get(city);
      if (cid) m.customers.add(cid);
      m.ordersCount++;
      m.revenue += inv.grandTotal;
      m.outstandingAmount += (inv.balance || 0);
    });

    let totalRev = 0;
    const data = Array.from(map.values()).map(m => {
      totalRev += m.revenue;
      return {
        ...m,
        customerCount: m.customers.size,
        averageOrderValue: m.ordersCount > 0 ? m.revenue / m.ordersCount : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalCustomers = data.reduce((s, d) => s + d.customerCount, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCities: data.length,
          totalCustomers,
          totalRevenue: totalRev,
          averageRevenuePerCity: data.length > 0 ? totalRev / data.length : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 23. CUSTOMER LEDGER REPORT
export const getCustomerLedgerReport = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    // Ideally filtered by req.query.customerId, but we'll fetch all ledger entries related to customers if not specified.
    // For this generic BI report without specific customer input, we will aggregate by customer or just show all customer ledgers.
    // The requirement says "detailed account statement for customers", meaning we list ledger entries.
    const AccountLedger = mongoose.model('AccountLedger');
    const ledgers = await AccountLedger.find({ businessId, entityType: 'Customer' })
      .sort({ date: 1 })
      .lean();

    let totalDebit = 0, totalCredit = 0;
    let balance = 0;

    const data = ledgers.map((l: any) => {
      totalDebit += (l.debit || 0);
      totalCredit += (l.credit || 0);
      balance += (l.debit || 0) - (l.credit || 0);
      return {
        date: l.date,
        voucherNumber: l.voucherNumber || l.referenceNumber || '-',
        particulars: l.particulars || l.description || 'Ledger Entry',
        debit: l.debit || 0,
        credit: l.credit || 0,
        balance: balance
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          openingBalance: 0, // In a real ledger, calculate before date range
          totalDebit,
          totalCredit,
          closingBalance: balance
        },
        data: data.reverse() // latest first
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 24. CUSTOMER PURCHASE FREQUENCY REPORT
export const getCustomerPurchaseFrequency = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString() || 'Cash';
      const cname = inv.customerSnapshot?.name || 'Cash Customer';

      if (!map.has(cid)) {
        map.set(cid, {
          customerName: cname,
          ordersCount: 0,
          revenue: 0,
          firstDate: inv.invoiceDate,
          lastDate: inv.invoiceDate
        });
      }
      const m = map.get(cid);
      m.ordersCount++;
      m.revenue += inv.grandTotal;
      if (new Date(inv.invoiceDate) < new Date(m.firstDate)) m.firstDate = inv.invoiceDate;
      if (new Date(inv.invoiceDate) > new Date(m.lastDate)) m.lastDate = inv.invoiceDate;
    });

    let repeatCount = 0;
    let totalFreq = 0;

    const data = Array.from(map.values()).map(m => {
      const days = (new Date(m.lastDate).getTime() - new Date(m.firstDate).getTime()) / (1000 * 3600 * 24);
      const freq = m.ordersCount > 1 ? days / (m.ordersCount - 1) : 0;
      if (m.ordersCount > 1) {
        repeatCount++;
        totalFreq += freq;
      }
      return {
        customerName: m.customerName,
        ordersCount: m.ordersCount,
        revenue: m.revenue,
        averageOrderValue: m.ordersCount > 0 ? m.revenue / m.ordersCount : 0,
        lastPurchaseDate: m.lastDate,
        purchaseFrequency: freq
      };
    }).sort((a, b) => b.ordersCount - a.ordersCount);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          activeCustomers: data.length,
          averagePurchaseFrequency: data.reduce((s, d) => s + d.ordersCount, 0) / (data.length || 1),
          repeatPurchaseRate: data.length > 0 ? (repeatCount / data.length) * 100 : 0,
          averageDaysBetweenOrders: repeatCount > 0 ? totalFreq / repeatCount : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 25. TOP 50 CUSTOMERS REPORT
export const getTop50Customers = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString() || 'Cash';
      const cname = inv.customerSnapshot?.name || 'Cash Customer';

      if (!map.has(cid)) {
        map.set(cid, { customerName: cname, ordersCount: 0, revenue: 0, cost: 0, outstandingAmount: 0 });
      }
      const m = map.get(cid);
      m.ordersCount++;
      m.revenue += inv.grandTotal;
      m.outstandingAmount += (inv.balance || 0);

      inv.lineItems?.forEach(item => {
        const product = item.productId ? productsMap.get(item.productId.toString()) : null;
        m.cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });
    });

    let totalProfit = 0, totalRev = 0;
    const data = Array.from(map.values()).map(m => {
      const profit = m.revenue - m.cost;
      return { ...m, profit };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 50).map((d, i) => {
      totalProfit += d.profit;
      totalRev += d.revenue;
      return { rank: i + 1, ...d };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenueFromTop50: totalRev,
          averageCustomerValue: data.length > 0 ? totalRev / data.length : 0,
          profitGenerated: totalProfit,
          repeatPurchasePct: data.length > 0 ? (data.filter(d => d.ordersCount > 1).length / data.length) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 26. CUSTOMER WISE ITEM SALES REPORT
export const getCustomerWiseItemSales = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>(); // key: customerId_itemId
    const customers = new Set<string>();

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString() || 'Cash';
      const cname = inv.customerSnapshot?.name || 'Cash Customer';
      customers.add(cname);

      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString() || 'Misc';
        const key = `${cid}_${pid}`;

        if (!map.has(key)) {
          map.set(key, {
            customer: cname,
            item: item.productName || 'Unknown',
            quantitySold: 0,
            revenue: 0,
            lastPurchaseDate: inv.invoiceDate
          });
        }
        const m = map.get(key);
        m.quantitySold += item.quantity;
        m.revenue += item.totalAmount;
        if (new Date(inv.invoiceDate) > new Date(m.lastPurchaseDate)) m.lastPurchaseDate = inv.invoiceDate;
      });
    });

    let totalItemsSold = 0, totalRevenue = 0;
    const data = Array.from(map.values()).map(m => {
      totalItemsSold += m.quantitySold;
      totalRevenue += m.revenue;
      return {
        ...m,
        averageSellingPrice: m.quantitySold > 0 ? m.revenue / m.quantitySold : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers: customers.size,
          totalProductsSold: totalItemsSold,
          revenueGenerated: totalRevenue,
          averageItemsPerCustomer: customers.size > 0 ? totalItemsSold / customers.size : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// --- PHASE 3: SUPPLIER ANALYTICS REPORTS ---

// 27. SUPPLIER LEDGER REPORT
export const getSupplierLedgerReport = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const AccountLedger = mongoose.model('AccountLedger');
    const ledgers = await AccountLedger.find({ businessId, entityType: 'Supplier' }).sort({ date: 1 }).lean();

    let totalDebit = 0, totalCredit = 0, balance = 0;

    const data = ledgers.map((l: any) => {
      totalDebit += (l.debit || 0);
      totalCredit += (l.credit || 0);
      balance += (l.credit || 0) - (l.debit || 0); // For suppliers, credit increases liability
      return {
        date: l.date,
        voucherNumber: l.voucherNumber || l.referenceNumber || '-',
        particulars: l.particulars || l.description || 'Ledger Entry',
        debit: l.debit || 0,
        credit: l.credit || 0,
        balance: balance
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          openingBalance: 0,
          purchases: totalCredit,
          payments: totalDebit,
          closingBalance: balance
        },
        data: data.reverse()
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 28. SUPPLIER PAYMENT HISTORY REPORT
export const getSupplierPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    // Assuming PaymentOut exists, else we'll mock using AccountLedger where entityType=Supplier and debit > 0
    const AccountLedger = mongoose.model('AccountLedger');
    const payments = await AccountLedger.find({ businessId, entityType: 'Supplier', debit: { $gt: 0 } }).sort({ date: -1 }).lean();
    
    // Also need supplier map to get outstanding payable
    const Supplier = mongoose.model('Supplier');
    const suppliers = await Supplier.find({ businessId }).lean();
    let totalOutstanding = 0;
    suppliers.forEach((s: any) => totalOutstanding += (s.closingBalance || 0));

    let totalPaid = 0;
    const data = payments.map((p: any) => {
      totalPaid += p.debit;
      return {
        paymentDate: p.date,
        supplier: p.entityName || 'Unknown Supplier',
        voucherNumber: p.voucherNumber || p.referenceNumber || '-',
        amountPaid: p.debit,
        paymentMethod: p.modeOfPayment || p.paymentMode || 'Bank Transfer',
        referenceNumber: p.referenceNumber || '-'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPayments: data.length,
          averagePaymentValue: data.length > 0 ? totalPaid / data.length : 0,
          outstandingPayables: totalOutstanding,
          paymentFrequency: 'Monthly' // placeholder
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 29. SUPPLIER WISE PURCHASE REPORT
export const getSupplierWisePurchase = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>();

    bills.forEach(bill => {
      const sid = bill.supplierId?.toString() || 'Cash';
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';

      if (!map.has(sid)) {
        map.set(sid, { supplier: sname, billsCount: 0, purchaseValue: 0, gstAmount: 0, paidAmount: 0, outstandingAmount: 0 });
      }
      const m = map.get(sid);
      m.billsCount++;
      m.purchaseValue += bill.grandTotal;
      m.gstAmount += (bill.totalGST || 0);
      m.paidAmount += (bill.amountPaid || 0);
      m.outstandingAmount += (bill.balance || 0);
    });

    let totalPur = 0, totalOut = 0;
    const data = Array.from(map.values()).map(m => {
      totalPur += m.purchaseValue;
      totalOut += m.outstandingAmount;
      return m;
    }).sort((a, b) => b.purchaseValue - a.purchaseValue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPurchaseValue: totalPur,
          supplierCount: data.length,
          averagePurchaseValue: data.length > 0 ? totalPur / data.length : 0,
          outstandingAmount: totalOut
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 30. SUPPLIER RATE COMPARISON REPORT
export const getSupplierRateComparison = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>(); // key: itemId

    bills.forEach(bill => {
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';
      bill.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        const itemName = item.productName || 'Unknown';
        
        if (!map.has(pid)) map.set(pid, { item: itemName, suppliers: new Map<string, any>() });
        const m = map.get(pid);
        
        if (!m.suppliers.has(sname)) {
          m.suppliers.set(sname, { supplier: sname, rate: item.rate, lastDate: bill.billDate });
        } else {
          const s = m.suppliers.get(sname);
          if (new Date(bill.billDate) > new Date(s.lastDate)) {
            s.rate = item.rate;
            s.lastDate = bill.billDate;
          }
        }
      });
    });

    const data: any[] = [];
    let savingsOpp = 0;
    let comparedItems = 0;

    Array.from(map.values()).forEach(m => {
      if (m.suppliers.size > 1) comparedItems++;
      const suppliersArray = Array.from(m.suppliers.values());
      const minRate = Math.min(...suppliersArray.map((s: any) => s.rate));
      const maxRate = Math.max(...suppliersArray.map((s: any) => s.rate));
      
      suppliersArray.forEach((s: any) => {
        data.push({
          item: m.item,
          supplier: s.supplier,
          purchaseRate: s.rate,
          lastPurchaseDate: s.lastDate,
          differencePct: minRate > 0 ? ((s.rate - minRate) / minRate) * 100 : 0
        });
        if (s.rate > minRate) savingsOpp += (s.rate - minRate); // Simplified savings potential
      });
    });

    data.sort((a, b) => a.item.localeCompare(b.item) || a.purchaseRate - b.purchaseRate);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          comparedItems,
          lowestSupplierRate: data.length > 0 ? Math.min(...data.map(d => d.purchaseRate)) : 0,
          highestSupplierRate: data.length > 0 ? Math.max(...data.map(d => d.purchaseRate)) : 0,
          potentialSavings: savingsOpp
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 31. SUPPLIER ITEM HISTORY REPORT
export const getSupplierItemHistory = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const data: any[] = [];
    const suppliers = new Set();
    const items = new Set();
    let totalQty = 0, totalVal = 0;

    bills.forEach(bill => {
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';
      suppliers.add(sname);
      
      bill.lineItems?.forEach(item => {
        items.add(item.productName);
        totalQty += item.quantity;
        totalVal += item.totalAmount;

        data.push({
          supplier: sname,
          item: item.productName || 'Unknown',
          quantityPurchased: item.quantity,
          rate: item.rate,
          purchaseValue: item.totalAmount,
          lastPurchaseDate: bill.billDate
        });
      });
    });

    data.sort((a, b) => new Date(b.lastPurchaseDate).getTime() - new Date(a.lastPurchaseDate).getTime());

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSuppliers: suppliers.size,
          totalItems: items.size,
          purchaseQuantity: totalQty,
          purchaseValue: totalVal
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 32. TOP SUPPLIERS REPORT
export const getTopSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>();
    let grandTotal = 0;

    bills.forEach(bill => {
      const sid = bill.supplierId?.toString() || 'Cash';
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';

      if (!map.has(sid)) map.set(sid, { supplier: sname, purchaseValue: 0, billsCount: 0, outstandingAmount: 0 });
      const m = map.get(sid);
      m.purchaseValue += bill.grandTotal;
      m.billsCount++;
      m.outstandingAmount += (bill.balance || 0);
      grandTotal += bill.grandTotal;
    });

    let top10Spend = 0;
    const data = Array.from(map.values())
      .sort((a, b) => b.purchaseValue - a.purchaseValue)
      .slice(0, 50)
      .map((d, i) => {
        if (i < 10) top10Spend += d.purchaseValue;
        return { rank: i + 1, ...d };
      });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          topSupplierSpend: top10Spend,
          purchaseContributionPct: grandTotal > 0 ? (top10Spend / grandTotal) * 100 : 0,
          supplierCount: map.size,
          averageSupplierValue: map.size > 0 ? grandTotal / map.size : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 33. PURCHASE RETURN REPORT
export const getPurchaseReturnReport = async (req: AuthRequest, res: Response) => {
  try {
    // Assuming a DebitNote or PurchaseReturn model exists. We'll fallback to empty if not.
    // Let's check if we can query DebitNote
    const DebitNote = mongoose.modelNames().includes('DebitNote') ? mongoose.model('DebitNote') : null;
    let returns: any[] = [];
    if (DebitNote) {
      returns = await DebitNote.find({ businessId: req.user!.businessId }).lean();
    }
    
    // As a robust fallback if model doesn't exist or is empty
    const data = returns.map((r: any) => ({
      returnNumber: r.debitNoteNumber || r.returnNumber || '-',
      supplier: r.supplierName || 'Unknown',
      item: r.itemName || 'Misc',
      quantityReturned: r.quantity || 1,
      returnValue: r.totalAmount || r.grandTotal || 0,
      reason: r.reason || 'Damaged Goods'
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReturns: data.length,
          returnValue: data.reduce((s: number, d: any) => s + d.returnValue, 0),
          returnPercentage: 0, // Need total purchases to calculate accurately
          supplierCredits: data.reduce((s: number, d: any) => s + d.returnValue, 0)
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 34. PURCHASE SUMMARY REPORT
export const getPurchaseSummaryReport = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const map = new Map<string, any>(); // group by YYYY-MM
    let totalPur = 0, totalBills = 0;
    const uniqueSuppliers = new Set();

    bills.forEach(bill => {
      const date = new Date(bill.billDate);
      const mYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!map.has(mYear)) map.set(mYear, { month: mYear, purchaseValue: 0, billsCount: 0, suppliers: new Set() });
      const m = map.get(mYear);
      m.purchaseValue += bill.grandTotal;
      m.billsCount++;
      if (bill.supplierId) m.suppliers.add(bill.supplierId.toString());
      uniqueSuppliers.add(bill.supplierId?.toString());
      
      totalPur += bill.grandTotal;
      totalBills++;
    });

    const data = Array.from(map.values()).map(m => ({
      ...m,
      supplierCount: m.suppliers.size,
      averageBillValue: m.billsCount > 0 ? m.purchaseValue / m.billsCount : 0
    })).sort((a, b) => b.month.localeCompare(a.month));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPurchases: totalPur,
          totalSuppliers: uniqueSuppliers.size,
          totalBills,
          averageBillValue: totalBills > 0 ? totalPur / totalBills : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// --- PHASE 3: PROFITABILITY REPORTS ---

// 35. ITEM WISE PROFIT REPORT
export const getItemWiseProfit = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        if (!map.has(pid)) {
          map.set(pid, { item: item.productName || 'Unknown', revenue: 0, cost: 0 });
        }
        const m = map.get(pid);
        m.revenue += item.totalAmount;
        const product = productsMap.get(pid);
        m.cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });
    });

    let totalRev = 0, totalCost = 0;
    const data = Array.from(map.values()).map(m => {
      totalRev += m.revenue;
      totalCost += m.cost;
      const profit = m.revenue - m.cost;
      return {
        ...m,
        profit,
        marginPct: m.revenue > 0 ? (profit / m.revenue) * 100 : 0
      };
    }).sort((a, b) => b.profit - a.profit);

    const totalProfit = totalRev - totalCost;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRev,
          cost: totalCost,
          profit: totalProfit,
          marginPct: totalRev > 0 ? (totalProfit / totalRev) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 36. CATEGORY WISE PROFIT REPORT
export const getCategoryWiseProfit = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const product = pid ? productsMap.get(pid) : null;
        const cat = product?.category || 'Uncategorized';
        
        if (!map.has(cat)) map.set(cat, { category: cat, revenue: 0, cost: 0 });
        const m = map.get(cat);
        m.revenue += item.totalAmount;
        m.cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });
    });

    let totalRev = 0, totalCost = 0;
    const data = Array.from(map.values()).map(m => {
      totalRev += m.revenue;
      totalCost += m.cost;
      const profit = m.revenue - m.cost;
      return { ...m, profit, marginPct: m.revenue > 0 ? (profit / m.revenue) * 100 : 0 };
    }).sort((a, b) => b.profit - a.profit);

    const totalProfit = totalRev - totalCost;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRev,
          cost: totalCost,
          profit: totalProfit,
          marginPct: totalRev > 0 ? (totalProfit / totalRev) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 37. CUSTOMER WISE PROFIT REPORT
export const getCustomerWiseProfit = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString() || 'Cash';
      const cname = inv.customerSnapshot?.name || 'Cash Customer';
      if (!map.has(cid)) map.set(cid, { customer: cname, revenue: 0, cost: 0 });
      const m = map.get(cid);
      m.revenue += inv.grandTotal;

      inv.lineItems?.forEach(item => {
        const product = item.productId ? productsMap.get(item.productId.toString()) : null;
        m.cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });
    });

    let totalRev = 0, totalCost = 0;
    const data = Array.from(map.values()).map(m => {
      totalRev += m.revenue;
      totalCost += m.cost;
      const profit = m.revenue - m.cost;
      return { ...m, profit, marginPct: m.revenue > 0 ? (profit / m.revenue) * 100 : 0 };
    }).sort((a, b) => b.profit - a.profit);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRev,
          profit: totalRev - totalCost,
          marginPct: totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0,
          customerCount: data.length
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 38. SUPPLIER WISE PROFIT REPORT
export const getSupplierWiseProfit = async (req: AuthRequest, res: Response) => {
  try {
    // Requires knowing which supplier provided which items sold. 
    // We'll map items sold back to their primary supplier.
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const [invoices, bills] = await Promise.all([
      Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean(),
      PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean()
    ]);

    // Map item -> primary supplier (latest supplier)
    const itemSupplierMap = new Map<string, string>();
    bills.sort((a: any, b: any) => new Date(a.billDate).getTime() - new Date(b.billDate).getTime()).forEach(bill => {
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';
      bill.lineItems?.forEach(item => {
        if (item.productId) itemSupplierMap.set(item.productId.toString(), sname);
      });
    });

    const productsMap = await getProductsMap(businessId);
    const map = new Map<string, any>(); // key: supplierName

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        if (!pid) return;
        const sname = itemSupplierMap.get(pid) || 'Unknown Supplier';

        if (!map.has(sname)) map.set(sname, { supplier: sname, purchaseValue: 0, salesValue: 0 });
        const m = map.get(sname);
        m.salesValue += item.totalAmount;
        const product = productsMap.get(pid);
        m.purchaseValue += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });
    });

    let totalRev = 0, totalCost = 0;
    const data = Array.from(map.values()).map(m => {
      totalRev += m.salesValue;
      totalCost += m.purchaseValue;
      const profit = m.salesValue - m.purchaseValue;
      return {
        ...m,
        profitContribution: profit,
        savingsPct: m.salesValue > 0 ? (profit / m.salesValue) * 100 : 0
      };
    }).sort((a, b) => b.profitContribution - a.profitContribution);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRev,
          cost: totalCost,
          profit: totalRev - totalCost,
          savingsPct: totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 39. INVOICE WISE PROFIT REPORT
export const getInvoiceWiseProfit = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    let totalRev = 0, totalCost = 0;
    const data = invoices.map(inv => {
      let cost = 0;
      inv.lineItems?.forEach(item => {
        const product = item.productId ? productsMap.get(item.productId.toString()) : null;
        cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });

      const revenue = inv.grandTotal;
      totalRev += revenue;
      totalCost += cost;
      const profit = revenue - cost;

      return {
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customerSnapshot?.name || 'Cash Customer',
        revenue,
        cost,
        profit,
        marginPct: revenue > 0 ? (profit / revenue) * 100 : 0
      };
    }).sort((a, b) => b.profit - a.profit);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRev,
          cost: totalCost,
          profit: totalRev - totalCost,
          marginPct: totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// 40. BRAND WISE PROFIT REPORT
export const getBrandWiseProfit = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const productsMap = await getProductsMap(businessId);

    const map = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString();
        const product = pid ? productsMap.get(pid) : null;
        const brand = product?.brand || 'Unbranded';
        
        if (!map.has(brand)) map.set(brand, { brand, revenue: 0, cost: 0 });
        const m = map.get(brand);
        m.revenue += item.totalAmount;
        m.cost += (product?.purchasePrice || (item.rate * 0.8)) * item.quantity;
      });
    });

    let totalRev = 0, totalCost = 0;
    const data = Array.from(map.values()).map(m => {
      totalRev += m.revenue;
      totalCost += m.cost;
      const profit = m.revenue - m.cost;
      return { ...m, profit, marginPct: m.revenue > 0 ? (profit / m.revenue) * 100 : 0 };
    }).sort((a, b) => b.profit - a.profit);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRev,
          cost: totalCost,
          profit: totalRev - totalCost,
          marginPct: totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};
