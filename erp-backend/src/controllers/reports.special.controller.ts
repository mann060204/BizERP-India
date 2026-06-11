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
