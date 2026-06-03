import mongoose from 'mongoose';
import AccountLedger from '../models/AccountLedger.model';
import Customer from '../models/Customer.model';
import Supplier from '../models/Supplier.model';

export class AccountingService {
  /**
   * Recalculates and updates the real-time balance of a Customer based on their Ledger
   */
  static async updateCustomerBalance(customerId: string | mongoose.Types.ObjectId, businessId: string) {
    const customer = await Customer.findOne({ _id: customerId, businessId });
    if (!customer) return 0;

    const ledgers = await AccountLedger.find({ customerId, businessId }).sort({ date: 1, createdAt: 1 });
    
    // Debit means Customer owes us money. Credit means we owe Customer money.
    let balance = customer.balanceType === 'Credit' ? -customer.openingBalance : customer.openingBalance;

    for (const entry of ledgers) {
      balance += entry.debit;
      balance -= entry.credit;
      
      // Update running balance on the ledger entry itself for fast UI querying
      if (entry.closingBalance !== balance) {
        entry.closingBalance = balance;
        await entry.save();
      }
    }

    customer.currentBalance = balance;
    await customer.save();
    return balance;
  }

  /**
   * Recalculates and updates the real-time balance of a Supplier based on their Ledger
   */
  static async updateSupplierBalance(supplierId: string | mongoose.Types.ObjectId, businessId: string) {
    const supplier = await Supplier.findOne({ _id: supplierId, businessId });
    if (!supplier) return 0;

    const ledgers = await AccountLedger.find({ supplierId, businessId }).sort({ date: 1, createdAt: 1 });
    
    // Credit means we owe Supplier money. Debit means Supplier owes us money.
    // However, to keep math consistent: positive = they owe us (Debit balance), negative = we owe them (Credit balance).
    // Typically Supplier balance is Credit.
    let balance = supplier.balanceType === 'Debit' ? supplier.openingBalance : -supplier.openingBalance;

    for (const entry of ledgers) {
      balance += entry.debit;
      balance -= entry.credit;
      
      if (entry.closingBalance !== balance) {
        entry.closingBalance = balance;
        await entry.save();
      }
    }

    supplier.currentBalance = balance;
    await supplier.save();
    return balance;
  }

  /**
   * Records a Sales Invoice into the Customer's Ledger
   */
  static async recordSalesInvoice(invoice: any) {
    if (!invoice.customerId) return;

    // 1. Debit Customer for Invoice Amount
    await AccountLedger.create({
      businessId: invoice.businessId,
      customerId: invoice.customerId,
      date: invoice.invoiceDate || new Date(),
      description: `Sales Invoice #${invoice.invoiceNumber}`,
      debit: invoice.grandTotal,
      credit: 0,
      referenceType: 'Invoice',
      referenceId: invoice._id.toString()
    });

    // 2. If payment was received instantly, Credit Customer
    if (invoice.amountReceived > 0) {
      await AccountLedger.create({
        businessId: invoice.businessId,
        customerId: invoice.customerId,
        date: invoice.invoiceDate || new Date(),
        description: `Payment Received (Inv #${invoice.invoiceNumber}) - ${invoice.paymentMode}`,
        debit: 0,
        credit: invoice.amountReceived,
        referenceType: 'Payment',
        referenceId: invoice._id.toString()
      });
    }

    await this.updateCustomerBalance(invoice.customerId, invoice.businessId.toString());
  }

  /**
   * Reverses a Sales Invoice from the Customer's Ledger
   */
  static async reverseInvoice(invoice: any) {
    if (!invoice.customerId) return;
    await AccountLedger.deleteMany({
      businessId: invoice.businessId,
      referenceId: invoice._id.toString(),
      referenceType: { $in: ['Invoice', 'Payment'] }
    });
    await this.updateCustomerBalance(invoice.customerId, invoice.businessId.toString());
  }

  /**
   * Records a Purchase Bill into the Supplier's Ledger
   */
  static async recordPurchaseBill(bill: any) {
    if (!bill.supplierId) return;

    // 1. Credit Supplier for Bill Amount (we owe them)
    await AccountLedger.create({
      businessId: bill.businessId,
      supplierId: bill.supplierId,
      date: bill.billDate || new Date(),
      description: `Purchase Bill #${bill.billNumber}`,
      debit: 0,
      credit: bill.grandTotal,
      referenceType: 'Purchase',
      referenceId: bill._id.toString()
    });

    // 2. If we paid instantly, Debit Supplier (reduces our liability)
    if (bill.amountPaid > 0) {
      await AccountLedger.create({
        businessId: bill.businessId,
        supplierId: bill.supplierId,
        date: bill.billDate || new Date(),
        description: `Payment Made (Bill #${bill.billNumber}) - ${bill.paymentMode}`,
        debit: bill.amountPaid,
        credit: 0,
        referenceType: 'Payment',
        referenceId: bill._id.toString()
      });
    }

    await this.updateSupplierBalance(bill.supplierId, bill.businessId.toString());
  }

  /**
   * Reverses a Purchase Bill from the Supplier's Ledger
   */
  static async reversePurchaseBill(bill: any) {
    if (!bill.supplierId) return;
    await AccountLedger.deleteMany({
      businessId: bill.businessId,
      referenceId: bill._id.toString(),
      referenceType: { $in: ['Purchase', 'Payment'] }
    });
    await this.updateSupplierBalance(bill.supplierId, bill.businessId.toString());
  }

  /**
   * Records a generic Payment Received from a Customer
   */
  static async recordCustomerPayment(businessId: string, customerId: string, amount: number, paymentMode: string, date: Date, referenceNo: string, notes: string) {
    await AccountLedger.create({
      businessId,
      customerId,
      date: date,
      description: notes || `Payment Received - ${paymentMode} ${referenceNo ? '(Ref: ' + referenceNo + ')' : ''}`,
      debit: 0,
      credit: amount, // Credit customer because they paid us
      referenceType: 'Payment',
      referenceId: referenceNo
    });
    return await this.updateCustomerBalance(customerId, businessId);
  }

  /**
   * Records a generic Payment Made to a Supplier
   */
  static async recordSupplierPayment(businessId: string, supplierId: string, amount: number, paymentMode: string, date: Date, referenceNo: string, notes: string) {
    await AccountLedger.create({
      businessId,
      supplierId,
      date: date,
      description: notes || `Payment Made - ${paymentMode} ${referenceNo ? '(Ref: ' + referenceNo + ')' : ''}`,
      debit: amount, // Debit supplier because we paid them
      credit: 0,
      referenceType: 'Payment',
      referenceId: referenceNo
    });
    return await this.updateSupplierBalance(supplierId, businessId);
  }


}
