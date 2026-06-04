import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { generateToken } from '../utils/jwt';

import Business from '../models/Business.model';
import User from '../models/User.model';
import Customer from '../models/Customer.model';
import Supplier from '../models/Supplier.model';
import Account from '../models/Account.model';
import Bank from '../models/Bank.model';
import Product from '../models/Product.model';

export const startNewYear = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let { 
      customYearLabel, 
      carryForwardStock = true, 
      carryForwardCustomerBalances = true, 
      carryForwardSupplierBalances = true, 
      carryForwardBankBalances = true, 
      lockPreviousFY = true,
      isHistorical = false,
      copyCustomers = true,
      copySuppliers = true,
      copyProducts = true
    } = req.body || {};

    if (isHistorical) {
      carryForwardStock = false;
      carryForwardCustomerBalances = false;
      carryForwardSupplierBalances = false;
      carryForwardBankBalances = false;
      lockPreviousFY = false;
    }
    const oldBusinessId = req.user!.businessId;
    const oldBusiness = await Business.findById(oldBusinessId);
    if (!oldBusiness) {
      res.status(404).json({ message: 'Current business not found' });
      return;
    }

    if (lockPreviousFY) {
      oldBusiness.isLocked = true;
    }

    // Ensure businessGroupId exists
    if (!oldBusiness.businessGroupId) {
      oldBusiness.businessGroupId = (oldBusiness._id as any).toString();
      oldBusiness.financialYearLabel = 'FY Legacy'; // Or calculate based on creation date
    }
    await oldBusiness.save();

    // Determine new financial year label
    const newYearNumber = parseInt(oldBusiness.financialYearLabel?.match(/\d{4}/)?.[0] || new Date().getFullYear().toString()) + 1;
    let newFinancialYearLabel = customYearLabel?.trim();
    if (!newFinancialYearLabel) {
      newFinancialYearLabel = isHistorical ? `FY ${newYearNumber - 2}-${(newYearNumber - 1).toString().slice(2)}` : `FY ${newYearNumber}-${(newYearNumber + 1).toString().slice(2)}`;
    }

    // Create the new business document
    const newBusiness = await Business.create({
      businessName: oldBusiness.businessName,
      ownerName: oldBusiness.ownerName,
      gstin: oldBusiness.gstin,
      pan: oldBusiness.pan,
      mobile: oldBusiness.mobile,
      email: oldBusiness.email,
      address: oldBusiness.address,
      businessType: oldBusiness.businessType,
      logo: oldBusiness.logo,
      financialYearStart: oldBusiness.financialYearStart,
      invoicePrefix: oldBusiness.invoicePrefix,
      nonGstInvoicePrefix: oldBusiness.nonGstInvoicePrefix,
      quotationPrefix: oldBusiness.quotationPrefix,
      nonGstQuotationPrefix: oldBusiness.nonGstQuotationPrefix,
      purchaseOrderPrefix: oldBusiness.purchaseOrderPrefix,
      salesReturnPrefix: oldBusiness.salesReturnPrefix,
      purchaseReturnPrefix: oldBusiness.purchaseReturnPrefix,
      bankDetails: oldBusiness.bankDetails,
      termsAndConditions: oldBusiness.termsAndConditions,
      invoiceTemplate: oldBusiness.invoiceTemplate,
      isCompositionScheme: oldBusiness.isCompositionScheme,
      productGroups: oldBusiness.productGroups,
      productBrands: oldBusiness.productBrands,
      productCategories: oldBusiness.productCategories,
      units: oldBusiness.units,
      expenseCategories: oldBusiness.expenseCategories,
      holidays: oldBusiness.holidays,
      discountSchemes: oldBusiness.discountSchemes,
      inventorySequencing: oldBusiness.inventorySequencing,
      documentSequences: oldBusiness.documentSequences,
      enableManufacturing: oldBusiness.enableManufacturing,
      cashInHand: carryForwardBankBalances ? oldBusiness.cashInHand : 0,
      
      // Keep everything above, but RESET counters and set group details
      businessGroupId: oldBusiness.businessGroupId,
      financialYearLabel: newFinancialYearLabel,
      invoiceCounter: 0,
      quotationCounter: 0,
      nonGstQuotationCounter: 0,
      nonGstInvoiceCounter: 0,
      purchaseOrderCounter: 0,
      salesReturnCounter: 0,
      purchaseReturnCounter: 0,
    });

    const newBusinessId = newBusiness._id;

    // Clone Customers
    if (copyCustomers) {
      const customers = await Customer.find({ businessId: oldBusinessId });
      if (customers.length > 0) {
        const newCustomers = customers.map(c => ({
          businessId: newBusinessId,
          name: c.name,
          mobile: c.mobile,
          email: c.email,
          gstin: c.gstin,
          billingAddress: c.billingAddress,
          panNo: c.panNo,
          gstType: c.gstType,
          tradeName: c.tradeName,
          phoneNo: c.phoneNo,
          documentType: c.documentType,
          documentNo: c.documentNo,
          dob: c.dob,
          anniversary: c.anniversary,
          creditAllowed: c.creditAllowed,
          priceCategory: c.priceCategory,
          remark: c.remark,
          creditLimit: c.creditLimit,
          openingBalance: carryForwardCustomerBalances ? c.currentBalance : 0,
          balanceType: carryForwardCustomerBalances ? (c.currentBalance >= 0 ? 'Debit' : 'Credit') : 'Debit',
          currentBalance: carryForwardCustomerBalances ? c.currentBalance : 0,
          tags: c.tags,
          photo: c.photo,
          isActive: c.isActive
        }));
        await Customer.insertMany(newCustomers);
      }
    }

    // Clone Suppliers
    if (copySuppliers) {
      const suppliers = await Supplier.find({ businessId: oldBusinessId });
      if (suppliers.length > 0) {
        const newSuppliers = suppliers.map(s => ({
          businessId: newBusinessId,
          name: s.name,
          mobile: s.mobile,
          email: s.email,
          gstin: s.gstin,
          pan: s.pan,
          address: s.address,
          contactPerson: s.contactPerson,
          note: s.note,
          bankDetails: s.bankDetails,
          creditLimit: s.creditLimit,
          creditAllowed: s.creditAllowed,
          priceCategory: s.priceCategory,
          gstType: s.gstType,
          tradeName: s.tradeName,
          phoneNo: s.phoneNo,
          documentType: s.documentType,
          documentNo: s.documentNo,
          dob: s.dob,
          anniversary: s.anniversary,
          photo: s.photo,
          tags: s.tags,
          openingBalance: carryForwardSupplierBalances ? s.currentBalance : 0,
          currentBalance: carryForwardSupplierBalances ? s.currentBalance : 0,
          balanceType: carryForwardSupplierBalances ? (s.currentBalance >= 0 ? 'Credit' : 'Debit') : 'Credit',
          isActive: s.isActive
        }));
        await Supplier.insertMany(newSuppliers);
      }
    }

    // Clone Accounts
    const accounts = await Account.find({ businessId: oldBusinessId });
    if (accounts.length > 0) {
      const newAccounts = accounts.map(a => ({
        businessId: newBusinessId,
        name: a.name,
        type: a.type,
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        openingBalance: carryForwardBankBalances ? a.currentBalance : 0,
        balanceType: carryForwardBankBalances ? (a.currentBalance >= 0 ? a.balanceType : (a.balanceType === 'Dr' ? 'Cr' : 'Dr')) : 'Dr',
        currentBalance: carryForwardBankBalances ? Math.abs(a.currentBalance) : 0,
        isActive: a.isActive
      }));
      await Account.insertMany(newAccounts);
    }

    // Clone Banks
    const banks = await Bank.find({ businessId: oldBusinessId });
    if (banks.length > 0) {
      const newBanks = banks.map(b => ({
        businessId: newBusinessId,
        bankName: b.bankName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        ifsc: b.ifsc,
        branch: b.branch,
        // Wait, where to get Bank current balance? We'll just leave openingBalance as is. 
        // A bank's true balance is recorded in its Account Ledger. 
        // But for simplicity, if Account copied correctly, it's fine. We'll set openingBalance to 0 unless we calculate it. 
        // Let's just find the corresponding Account's currentBalance.
        openingBalance: carryForwardBankBalances ? (accounts.find(a => a.accountNumber === b.accountNumber)?.currentBalance || b.openingBalance) : 0,
        isActive: b.isActive
      }));
      await Bank.insertMany(newBanks);
    }

    // Clone Products
    if (copyProducts) {
      const products = await Product.find({ businessId: oldBusinessId });
      if (products.length > 0) {
        const newProducts = products.map(p => ({
          businessId: newBusinessId,
          name: p.name,
          printName: p.printName,
          group: p.group,
          brand: p.brand,
          sku: p.sku,
          hsnCode: p.hsnCode,
          sacCode: p.sacCode,
          category: p.category,
          type: p.type,
          unit: p.unit,
          secondaryUnit: p.secondaryUnit,
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          sellingPrice2: p.sellingPrice2,
          sellingPrice3: p.sellingPrice3,
          minSalePrice: p.minSalePrice,
          mrp: p.mrp,
          conversionRate: p.conversionRate,
          gstRate: p.gstRate,
          cessRate: p.cessRate,
          igstRate: p.igstRate,
          saleDiscount: p.saleDiscount,
          saleDiscountType: p.saleDiscountType,
          barcode: p.barcode,
          location: p.location,
          batchNo: p.batchNo,
          description: p.description,
          productType: p.productType,
          printDescription: p.printDescription,
          printBatchNo: p.printBatchNo,
          oneClickSale: p.oneClickSale,
          enableTracking: p.enableTracking,
          printExpiryDate: p.printExpiryDate,
          notForSale: p.notForSale,
          reorderLevel: p.reorderLevel,
          lowLevelLimit: p.lowLevelLimit,
          openingStock: carryForwardStock ? p.currentStock : 0,
          openingStockValue: carryForwardStock ? ((p.currentStock * p.purchasePrice) || 0) : 0,
          currentStock: carryForwardStock ? p.currentStock : 0,
          isActive: p.isActive
        }));
        await Product.insertMany(newProducts);
      }
    }

    // Update User
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.businessId = newBusinessId;
    user.businessGroupId = oldBusiness.businessGroupId;
    await user.save();

    // Generate new token
    const token = generateToken((user._id as any).toString(), newBusinessId.toString(), user.role);

    res.json({ message: 'New financial year started successfully', token, financialYearLabel: newFinancialYearLabel });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableYears = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const businessGroupId = user.businessGroupId || (user.businessId as any).toString();
    
    const years = await Business.find({ businessGroupId })
      .select('businessName financialYearLabel createdAt')
      .sort({ createdAt: -1 });
      
    // If no group found (legacy user), just return the current one
    if (years.length === 0) {
      const current = await Business.findById(user.businessId).select('businessName financialYearLabel createdAt');
      res.json({ years: [current] });
      return;
    }

    res.json({ years });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const switchYear = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetBusinessId } = req.body;
    if (!targetBusinessId) {
      res.status(400).json({ message: 'Target Business ID is required' });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const targetBusiness = await Business.findById(targetBusinessId);
    if (!targetBusiness) {
      res.status(404).json({ message: 'Target business not found' });
      return;
    }

    // Check if user is authorized to access this business
    if (user.businessGroupId !== targetBusiness.businessGroupId && user.businessId.toString() !== targetBusinessId) {
      res.status(403).json({ message: 'Not authorized to switch to this business' });
      return;
    }

    // Switch
    user.businessId = targetBusiness._id as any;
    await user.save();

    const token = generateToken((user._id as any).toString(), targetBusinessId, user.role);

    res.json({ message: 'Switched successfully', token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
