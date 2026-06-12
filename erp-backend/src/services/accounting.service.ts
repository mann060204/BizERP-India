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
   * Helper to update Cash or specific Bank balance based on payment received or made.
   * CRITICAL FIX: Now accepts explicit `txnDate` parameter instead of using new Date().
   */
  static async updateCashOrBankBalance(
    businessId: string, 
    amount: number, 
    paymentMode: string, 
    bankId?: string, 
    isReceiving: boolean = true,
    description: string = 'Payment',
    referenceType: string = 'Payment',
    referenceId?: string,
    txnDate?: Date
  ) {
    if (!amount) return;
    const change = isReceiving ? amount : -amount;
    const ledgerDate = txnDate || new Date();
    
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

        // Create Ledger Entry with the ACTUAL transaction date
        await AccountLedger.create({
          businessId,
          accountId: bankId,
          date: ledgerDate,
          description,
          debit: isReceiving ? amount : 0,
          credit: !isReceiving ? amount : 0,
          referenceType,
          referenceId,
          closingBalance: account.currentBalance,
          voucherType: referenceType === 'Payment' ? 'Payment' : 'Receipt',
          voucherNo: referenceId || undefined
        });
      }
    }
  }

  /**
   * Records a Sales Invoice into the Customer's Ledger
   */
  static async recordSalesInvoice(invoice: any) {
    if (!invoice.customerId) return;
    const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date();

    // 1. Debit Customer for Invoice Amount
    await AccountLedger.create({
      businessId: invoice.businessId,
      customerId: invoice.customerId,
      date: invoiceDate,
      description: `Sales Invoice #${invoice.invoiceNumber}`,
      debit: invoice.grandTotal,
      credit: 0,
      referenceType: 'Invoice',
      referenceId: invoice._id.toString(),
      voucherType: 'Sale',
      voucherNo: invoice.invoiceNumber,
      partyName: invoice.customerSnapshot?.name || ''
    });

    // 2. If payment was received instantly, Credit Customer
    if (invoice.paymentHistory && invoice.paymentHistory.length > 0) {
      for (const payment of invoice.paymentHistory) {
        const payDate = payment.date ? new Date(payment.date) : invoiceDate;
        await AccountLedger.create({
          businessId: invoice.businessId,
          customerId: invoice.customerId,
          date: payDate,
          description: `Payment Received (Inv #${invoice.invoiceNumber}) - ${payment.mode} ${payment.txnId ? '(Txn: ' + payment.txnId + ')' : ''}`,
          debit: 0,
          credit: payment.amount,
          referenceType: 'Payment',
          referenceId: invoice._id.toString(),
          voucherType: 'Receipt',
          voucherNo: invoice.invoiceNumber,
          partyName: invoice.customerSnapshot?.name || ''
        });
        await this.updateCashOrBankBalance(
          invoice.businessId.toString(), payment.amount, payment.mode, payment.bankId, true,
          `Payment Received (Inv #${invoice.invoiceNumber})`, 'Payment', invoice._id.toString(),
          payDate
        );
      }
    } else if (invoice.amountReceived > 0) {
      await AccountLedger.create({
        businessId: invoice.businessId,
        customerId: invoice.customerId,
        date: invoiceDate,
        description: `Payment Received (Inv #${invoice.invoiceNumber}) - ${invoice.paymentMode}`,
        debit: 0,
        credit: invoice.amountReceived,
        referenceType: 'Payment',
        referenceId: invoice._id.toString(),
        voucherType: 'Receipt',
        voucherNo: invoice.invoiceNumber,
        partyName: invoice.customerSnapshot?.name || ''
      });
      await this.updateCashOrBankBalance(
        invoice.businessId.toString(), invoice.amountReceived, invoice.paymentMode || 'Cash', invoice.paymentBankId, true,
        `Payment Received (Inv #${invoice.invoiceNumber})`, 'Payment', invoice._id.toString(),
        invoiceDate
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
    const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date();
    if (invoice.paymentHistory && invoice.paymentHistory.length > 0) {
      for (const payment of invoice.paymentHistory) {
        await this.updateCashOrBankBalance(
          invoice.businessId.toString(), payment.amount, payment.mode, payment.bankId, false,
          `Reversal: Payment Received (Inv #${invoice.invoiceNumber})`, 'Payment', invoice._id.toString(),
          payment.date ? new Date(payment.date) : invoiceDate
        );
      }
    } else if (invoice.amountReceived > 0) {
      await this.updateCashOrBankBalance(
        invoice.businessId.toString(), invoice.amountReceived, invoice.paymentMode || 'Cash', invoice.paymentBankId, false,
        `Reversal: Payment Received (Inv #${invoice.invoiceNumber})`, 'Payment', invoice._id.toString(),
        invoiceDate
      );
    }
    
    await this.updateCustomerBalance(invoice.customerId, invoice.businessId.toString());
  }

  /**
   * Records a Purchase Bill into the Supplier's Ledger
   */
  static async recordPurchaseBill(bill: any) {
    if (!bill.supplierId) return;
    const billDate = bill.billDate ? new Date(bill.billDate) : new Date();

    // 1. Credit Supplier for Bill Amount (we owe them)
    await AccountLedger.create({
      businessId: bill.businessId,
      supplierId: bill.supplierId,
      date: billDate,
      description: `Purchase Bill #${bill.billNumber}`,
      debit: 0,
      credit: bill.grandTotal,
      referenceType: 'Purchase',
      referenceId: bill._id.toString(),
      voucherType: 'Purchase',
      voucherNo: bill.billNumber,
      partyName: bill.supplierSnapshot?.name || ''
    });

    // 2. If we paid instantly, Debit Supplier (reduces our liability)
    if (bill.amountPaid > 0) {
      const payDate = bill.paymentDate ? new Date(bill.paymentDate) : billDate;
      await AccountLedger.create({
        businessId: bill.businessId,
        supplierId: bill.supplierId,
        date: payDate,
        description: `Payment Made (Bill #${bill.billNumber}) - ${bill.paymentMode}`,
        debit: bill.amountPaid,
        credit: 0,
        referenceType: 'Payment',
        referenceId: bill._id.toString(),
        voucherType: 'Payment',
        voucherNo: bill.billNumber,
        partyName: bill.supplierSnapshot?.name || ''
      });
      await this.updateCashOrBankBalance(
        bill.businessId.toString(), bill.amountPaid, bill.paymentMode || 'Cash', bill.paymentBankId, false,
        `Payment Made (Bill #${bill.billNumber})`, 'Payment', bill._id.toString(),
        payDate
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
    
    const billDate = bill.billDate ? new Date(bill.billDate) : new Date();
    // Reverse Cash/Bank (For purchase, we originally paid, so to reverse we add the cash back)
    if (bill.amountPaid > 0) {
      await this.updateCashOrBankBalance(
        bill.businessId.toString(), bill.amountPaid, bill.paymentMode || 'Cash', bill.paymentBankId, true,
        `Reversal: Payment Made (Bill #${bill.billNumber})`, 'Payment', bill._id.toString(),
        bill.paymentDate ? new Date(bill.paymentDate) : billDate
      );
    }
    
    await this.updateSupplierBalance(bill.supplierId, bill.businessId.toString());
  }

  /**
   * Records a Purchase Return (Debit Note) into the Supplier's Ledger.
   * A purchase return REDUCES our liability to the supplier (Debit Supplier).
   */
  static async recordPurchaseReturn(returnDoc: any) {
    if (!returnDoc.supplierId) return;
    const returnDate = returnDoc.returnDate ? new Date(returnDoc.returnDate) : new Date();

    await AccountLedger.create({
      businessId: returnDoc.businessId,
      supplierId: returnDoc.supplierId,
      date: returnDate,
      description: `Purchase Return (Debit Note) #${returnDoc.returnNumber}`,
      debit: returnDoc.grandTotal,
      credit: 0,
      referenceType: 'PurchaseReturn',
      referenceId: returnDoc._id.toString(),
      voucherType: 'PurchaseReturn',
      voucherNo: returnDoc.returnNumber,
      partyName: returnDoc.supplierSnapshot?.name || ''
    });

    await this.updateSupplierBalance(returnDoc.supplierId, returnDoc.businessId.toString());
  }

  /**
   * Reverses a Purchase Return from the Supplier's Ledger
   */
  static async reversePurchaseReturn(returnDoc: any) {
    if (!returnDoc.supplierId) return;
    await AccountLedger.deleteMany({
      businessId: returnDoc.businessId,
      referenceId: returnDoc._id.toString(),
      referenceType: 'PurchaseReturn'
    });
    await this.updateSupplierBalance(returnDoc.supplierId, returnDoc.businessId.toString());
  }

  /**
   * Records a Sales Return (Credit Note) into the Customer's Ledger.
   * A sales return REDUCES what the customer owes us (Credit Customer).
   */
  static async recordSalesReturn(returnDoc: any) {
    if (!returnDoc.customerId) return;
    const returnDate = returnDoc.returnDate ? new Date(returnDoc.returnDate) : new Date();

    await AccountLedger.create({
      businessId: returnDoc.businessId,
      customerId: returnDoc.customerId,
      date: returnDate,
      description: `Sales Return (Credit Note) #${returnDoc.returnNumber}`,
      debit: 0,
      credit: returnDoc.grandTotal,
      referenceType: 'SalesReturn',
      referenceId: returnDoc._id.toString(),
      voucherType: 'SalesReturn',
      voucherNo: returnDoc.returnNumber,
      partyName: returnDoc.customerSnapshot?.name || ''
    });

    await this.updateCustomerBalance(returnDoc.customerId, returnDoc.businessId.toString());
  }

  /**
   * Reverses a Sales Return from the Customer's Ledger
   */
  static async reverseSalesReturn(returnDoc: any) {
    if (!returnDoc.customerId) return;
    await AccountLedger.deleteMany({
      businessId: returnDoc.businessId,
      referenceId: returnDoc._id.toString(),
      referenceType: 'SalesReturn'
    });
    await this.updateCustomerBalance(returnDoc.customerId, returnDoc.businessId.toString());
  }

  /**
   * Records an Expense into the General Ledger.
   * Creates a ledger entry and updates cash/bank balance.
   */
  static async recordExpense(expense: any) {
    const expenseDate = expense.date ? new Date(expense.date) : new Date();

    // Create a general ledger entry for the expense
    await AccountLedger.create({
      businessId: expense.businessId,
      accountId: expense.accountId || undefined,
      date: expenseDate,
      description: `Expense: ${expense.category || 'General'} - ${expense.description || expense.notes || ''}`.trim(),
      debit: expense.amount,
      credit: 0,
      referenceType: 'Expense',
      referenceId: expense._id.toString(),
      voucherType: 'Expense',
      voucherNo: expense.voucherNo || expense._id.toString().slice(-6),
      partyName: expense.paidTo || expense.vendorName || ''
    });

    // Update cash or bank
    if (expense.amount > 0) {
      await this.updateCashOrBankBalance(
        expense.businessId.toString(), expense.amount, expense.paymentMode || 'Cash', expense.bankId, false,
        `Expense: ${expense.category || 'General'}`, 'Expense', expense._id.toString(),
        expenseDate
      );
    }
  }

  /**
   * Reverses an Expense from the General Ledger
   */
  static async reverseExpense(expense: any) {
    await AccountLedger.deleteMany({
      businessId: expense.businessId,
      referenceId: expense._id.toString(),
      referenceType: 'Expense'
    });

    // Reverse cash or bank
    const expenseDate = expense.date ? new Date(expense.date) : new Date();
    if (expense.amount > 0) {
      await this.updateCashOrBankBalance(
        expense.businessId.toString(), expense.amount, expense.paymentMode || 'Cash', expense.bankId, true,
        `Reversal: Expense ${expense.category || ''}`, 'Expense', expense._id.toString(),
        expenseDate
      );
    }
  }

  /**
   * Records a generic Payment Received from a Customer
   */
  static async recordCustomerPayment(businessId: string, customerId: string, amount: number, paymentMode: string, date: Date, referenceNo: string, notes: string, bankId?: string) {
    const customerDoc = await Customer.findOne({ _id: customerId, businessId });
    await AccountLedger.create({
      businessId,
      customerId,
      date: date,
      description: notes || `Payment Received - ${paymentMode} ${referenceNo ? '(Ref: ' + referenceNo + ')' : ''}`,
      debit: 0,
      credit: amount, // Credit customer because they paid us
      referenceType: 'Payment',
      referenceId: referenceNo,
      voucherType: 'Receipt',
      voucherNo: referenceNo || undefined,
      partyName: customerDoc?.name || ''
    });
    await this.updateCashOrBankBalance(businessId, amount, paymentMode || 'Cash', bankId, true,
      `Payment Received from ${customerDoc?.name || 'Customer'}`, 'Payment', referenceNo,
      date
    );
    return await this.updateCustomerBalance(customerId, businessId);
  }

  /**
   * Records a generic Payment Made to a Supplier
   */
  static async recordSupplierPayment(businessId: string, supplierId: string, amount: number, paymentMode: string, date: Date, referenceNo: string, notes: string, bankId?: string) {
    const supplierDoc = await Supplier.findOne({ _id: supplierId, businessId });
    await AccountLedger.create({
      businessId,
      supplierId,
      date: date,
      description: notes || `Payment Made - ${paymentMode} ${referenceNo ? '(Ref: ' + referenceNo + ')' : ''}`,
      debit: amount, // Debit supplier because we paid them
      credit: 0,
      referenceType: 'Payment',
      referenceId: referenceNo,
      voucherType: 'Payment',
      voucherNo: referenceNo || undefined,
      partyName: supplierDoc?.name || ''
    });
    await this.updateCashOrBankBalance(businessId, amount, paymentMode || 'Cash', bankId, false,
      `Payment Made to ${supplierDoc?.name || 'Supplier'}`, 'Payment', referenceNo,
      date
    );
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
      referenceId: '',
      voucherType: 'Adjustment'
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
