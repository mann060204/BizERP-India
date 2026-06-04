const fs = require('fs');
const file = 'd:/ERP WEBSITE/erp-backend/src/controllers/reports.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const newCode = `
export const getCashBook = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    
    const paymentLedgers = await AccountLedger.find({ businessId, referenceType: 'Payment' }).lean();
    
    const bankAccounts = await Account.find({ businessId, type: 'Bank' });
    const bankIds = bankAccounts.map(a => a._id);
    const bankLedgers = await AccountLedger.find({ businessId, accountId: { $in: bankIds } }).lean();
    
    const expenses = await Expense.find({ businessId }).lean();
    
    const transactions: any[] = [];
    
    paymentLedgers.forEach((l: any) => {
      let debit = 0, credit = 0;
      if (l.customerId && l.credit > 0) debit = l.credit;
      else if (l.supplierId && l.debit > 0) credit = l.debit;
      else return;
      
      transactions.push({
        date: l.date,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        debit, credit,
        referenceType: l.referenceType
      });
    });
    
    bankLedgers.forEach((l: any) => {
      transactions.push({
        date: l.date,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        debit: l.debit || 0,
        credit: l.credit || 0,
        referenceType: l.referenceType || 'Journal'
      });
    });
    
    expenses.forEach((e: any) => {
      transactions.push({
        date: e.date,
        particulars: e.category + (e.vendorName ? \` - \${e.vendorName}\` : ''),
        voucherNo: e._id.toString().slice(-6).toUpperCase(),
        debit: 0,
        credit: e.totalWithTax || e.amount || 0,
        referenceType: 'Expense'
      });
    });
    
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sendSuccess(res, transactions);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getBusinessBook = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const ledgers = await AccountLedger.find({ businessId })
      .populate('accountId', 'name type')
      .populate('customerId', 'name')
      .populate('supplierId', 'name')
      .sort({ date: -1 })
      .limit(1000)
      .lean();
      
    const expenses = await Expense.find({ businessId }).sort({ date: -1 }).limit(1000).lean();
    
    const transformed = ledgers.map((l: any) => ({
      date: l.date,
      accountId: l.accountId || l.customerId || l.supplierId || { name: 'Cash / Bank' },
      particulars: l.description,
      voucherType: l.referenceType || 'Journal',
      debit: l.debit || 0,
      credit: l.credit || 0,
    }));
    
    expenses.forEach((e: any) => {
      transformed.push({
        date: e.date,
        accountId: { name: 'Expense Account' },
        particulars: e.category + (e.vendorName ? \` - \${e.vendorName}\` : ''),
        voucherType: 'Expense',
        debit: e.totalWithTax || e.amount || 0,
        credit: 0,
      });
    });
    
    transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sendSuccess(res, transformed.slice(0, 1000));
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const paymentLedgers = await AccountLedger.find({ businessId, referenceType: 'Payment', debit: { $gt: 0 }, supplierId: { $exists: true } }).populate('supplierId', 'name').sort({ date: -1 }).lean();
    
    const bankAccounts = await Account.find({ businessId, type: 'Bank' });
    const bankIds = bankAccounts.map(a => a._id);
    const bankLedgers = await AccountLedger.find({ businessId, accountId: { $in: bankIds }, credit: { $gt: 0 } }).populate('accountId', 'name').sort({ date: -1 }).lean();
    
    const expenses = await Expense.find({ businessId }).sort({ date: -1 }).lean();
    
    const transformed: any[] = [];
    
    paymentLedgers.forEach((l: any) => {
      transformed.push({
        date: l.date,
        accountId: l.supplierId,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        credit: l.debit || 0,
      });
    });
    
    bankLedgers.forEach((l: any) => {
      transformed.push({
        date: l.date,
        accountId: l.accountId,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        credit: l.credit || 0,
      });
    });
    
    expenses.forEach((e: any) => {
      transformed.push({
        date: e.date,
        accountId: { name: 'Expense' },
        particulars: e.category + (e.vendorName ? \` - \${e.vendorName}\` : ''),
        voucherNo: e._id.toString().slice(-6).toUpperCase(),
        credit: e.totalWithTax || e.amount || 0,
      });
    });
    
    transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentReceived = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const paymentLedgers = await AccountLedger.find({ businessId, referenceType: 'Payment', credit: { $gt: 0 }, customerId: { $exists: true } }).populate('customerId', 'name').sort({ date: -1 }).lean();
    
    const bankAccounts = await Account.find({ businessId, type: 'Bank' });
    const bankIds = bankAccounts.map(a => a._id);
    const bankLedgers = await AccountLedger.find({ businessId, accountId: { $in: bankIds }, debit: { $gt: 0 } }).populate('accountId', 'name').sort({ date: -1 }).lean();
    
    const transformed: any[] = [];
    
    paymentLedgers.forEach((l: any) => {
      transformed.push({
        date: l.date,
        accountId: l.customerId,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        debit: l.credit || 0,
      });
    });
    
    bankLedgers.forEach((l: any) => {
      transformed.push({
        date: l.date,
        accountId: l.accountId,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        debit: l.debit || 0,
      });
    });
    
    transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};
`

const startIdx = content.indexOf('export const getCashBook');
const endIdx = content.indexOf('export const getChartOfAccounts');
if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newCode + '\n' + content.substring(endIdx);
  fs.writeFileSync(file, content);
  console.log('Success');
} else {
  console.log('Indices not found');
}
