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
