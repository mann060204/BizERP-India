import mongoose from 'mongoose';
import Account from '../models/Account.model';
import AccountLedger from '../models/AccountLedger.model';
import Customer from '../models/Customer.model';
import Supplier from '../models/Supplier.model';
import Business from '../models/Business.model';

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
   * Helper to update Cash or specific Bank balance based on payment received or made
   */
  static async updateCashOrBankBalance(
    businessId: string, 
    amount: number, 
    paymentMode: string, 
    bankId?: string, 
    isReceiving: boolean = true,
    description: string = 'Payment',
    referenceType: string = 'Payment',
    referenceId?: string
  ) {
    if (!amount) return;
    const change = isReceiving ? amount : -amount;
    
    if (paymentMode.toLowerCase() === 'cash') {
      await Business.findByIdAndUpdate(businessId, { $inc: { cashInHand: change } });
    } else if (bankId && paymentMode.toLowerCase() !== 'cash') {
      const account = await Account.findOne({ _id: bankId, businessId });
      if (account) {
        // Update balance
        if (account.balanceType === 'Dr') {
          account.currentBalance += change;
        } else {
          account.currentBalance -= change;
        }
        await account.save();

        // Create Ledger Entry
        await AccountLedger.create({
          businessId,
          accountId: bankId,
          date: new Date(),
          description,
          debit: isReceiving ? amount : 0,
          credit: !isReceiving ? amount : 0,
          referenceType,
          referenceId,
          closingBalance: account.currentBalance
        });
      }
    }
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
    if (invoice.paymentHistory && invoice.paymentHistory.length > 0) {
      for (const payment of invoice.paymentHistory) {
        await AccountLedger.create({
          businessId: invoice.businessId,
          customerId: invoice.customerId,
          date: payment.date || invoice.invoiceDate || new Date(),
          description: `Payment Received (Inv #${invoice.invoiceNumber}) - ${payment.mode} ${payment.txnId ? '(Txn: ' + payment.txnId + ')' : ''}`,
          debit: 0,
          credit: payment.amount,
          referenceType: 'Payment',
          referenceId: invoice._id.toString()
        });
        await this.updateCashOrBankBalance(
          invoice.businessId.toString(), payment.amount, payment.mode, payment.bankId, true,
          `Payment Received (Inv #${invoice.invoiceNumber})`, 'Payment', invoice._id.toString()
        );
      }
    } else if (invoice.amountReceived > 0) {
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
      await this.updateCashOrBankBalance(
        invoice.businessId.toString(), invoice.amountReceived, invoice.paymentMode || 'Cash', invoice.paymentBankId, true,
        `Payment Received (Inv #${invoice.invoiceNumber})`, 'Payment', invoice._id.toString()
      );
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
    
    // Reverse Cash/Bank
    if (invoice.paymentHistory && invoice.paymentHistory.length > 0) {
      for (const payment of invoice.paymentHistory) {
        await this.updateCashOrBankBalance(
          invoice.businessId.toString(), payment.amount, payment.mode, payment.bankId, false,
          `Reversal: Payment Received (Inv #${invoice.invoiceNumber})`, 'Payment', invoice._id.toString()
        );
      }
    } else if (invoice.amountReceived > 0) {
      await this.updateCashOrBankBalance(
        invoice.businessId.toString(), invoice.amountReceived, invoice.paymentMode || 'Cash', invoice.paymentBankId, false,
        `Reversal: Payment Received (Inv #${invoice.invoiceNumber})`, 'Payment', invoice._id.toString()
      );
    }
    
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
      await this.updateCashOrBankBalance(
        bill.businessId.toString(), bill.amountPaid, bill.paymentMode || 'Cash', bill.paymentBankId, false,
        `Payment Made (Bill #${bill.billNumber})`, 'Payment', bill._id.toString()
      );
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
    
    // Reverse Cash/Bank (For purchase, we originally paid, so to reverse we add the cash back)
    if (bill.amountPaid > 0) {
      await this.updateCashOrBankBalance(
        bill.businessId.toString(), bill.amountPaid, bill.paymentMode || 'Cash', bill.paymentBankId, true,
        `Reversal: Payment Made (Bill #${bill.billNumber})`, 'Payment', bill._id.toString()
      );
    }
    
    await this.updateSupplierBalance(bill.supplierId, bill.businessId.toString());
  }

  /**
   * Records a generic Payment Received from a Customer
   */
  static async recordCustomerPayment(businessId: string, customerId: string, amount: number, paymentMode: string, date: Date, referenceNo: string, notes: string, bankId?: string) {
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
    await this.updateCashOrBankBalance(businessId, amount, paymentMode || 'Cash', bankId, true);
    return await this.updateCustomerBalance(customerId, businessId);
  }

  /**
   * Records a generic Payment Made to a Supplier
   */
  static async recordSupplierPayment(businessId: string, supplierId: string, amount: number, paymentMode: string, date: Date, referenceNo: string, notes: string, bankId?: string) {
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
    await this.updateCashOrBankBalance(businessId, amount, paymentMode || 'Cash', bankId, false);
    return await this.updateSupplierBalance(supplierId, businessId);
  }


  /**
   * Records a manual Adjustment (Debit or Credit) to a Customer or Supplier ledger
   */
  static async addManualAdjustment(businessId: string, entityId: string, entityType: 'Customer' | 'Supplier', type: 'Debit' | 'Credit', amount: number, date: Date, description: string) {
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    await AccountLedger.create({
      businessId,
      [entityType === 'Customer' ? 'customerId' : 'supplierId']: entityId,
      date,
      description,
      debit: type === 'Debit' ? amount : 0,
      credit: type === 'Credit' ? amount : 0,
      referenceType: 'Adjustment',
      referenceId: ''
    });

    if (entityType === 'Customer') {
      return await this.updateCustomerBalance(entityId, businessId);
    } else {
      return await this.updateSupplierBalance(entityId, businessId);
    }
  }

  /**
   * Edits an existing Payment or Adjustment ledger entry
   */
  static async updateLedgerEntry(businessId: string, ledgerId: string, updates: { date?: Date, description?: string, amount?: number }) {
    const entry = await AccountLedger.findOne({ _id: ledgerId, businessId });
    if (!entry) throw new Error('Ledger entry not found');

    if (!['Payment', 'Adjustment'].includes(entry.referenceType || '')) {
      throw new Error('Only manual Payments or Adjustments can be edited directly');
    }

    if (updates.date) entry.date = updates.date;
    if (updates.description) entry.description = updates.description;
    
    if (updates.amount !== undefined && updates.amount > 0) {
      const isDebit = entry.debit > 0;
      const oldAmount = isDebit ? entry.debit : entry.credit;
      const amountDiff = updates.amount - oldAmount;

      if (isDebit) entry.debit = updates.amount;
      else entry.credit = updates.amount;

      // Note: We don't adjust cash/bank automatically for edits to avoid complex cascading issues.
      // If bank adjustment is needed, it should be done via accounts.
    }

    await entry.save();

    if (entry.customerId) {
      return await this.updateCustomerBalance(entry.customerId, businessId);
    } else if (entry.supplierId) {
      return await this.updateSupplierBalance(entry.supplierId, businessId);
    }
    return 0;
  }

  /**
   * Deletes an existing Payment or Adjustment ledger entry
   */
  static async deleteLedgerEntry(businessId: string, ledgerId: string) {
    const entry = await AccountLedger.findOne({ _id: ledgerId, businessId });
    if (!entry) throw new Error('Ledger entry not found');

    if (!['Payment', 'Adjustment'].includes(entry.referenceType || '')) {
      throw new Error('Only manual Payments or Adjustments can be deleted directly');
    }

    await AccountLedger.deleteOne({ _id: ledgerId, businessId });

    if (entry.customerId) {
      return await this.updateCustomerBalance(entry.customerId, businessId);
    } else if (entry.supplierId) {
      return await this.updateSupplierBalance(entry.supplierId, businessId);
    }
    return 0;
  }

}
