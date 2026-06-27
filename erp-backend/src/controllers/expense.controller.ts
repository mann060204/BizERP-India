import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Expense from '../models/Expense.model';
import { AccountingService } from '../services/accounting.service';

// GET /api/v1/expenses
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, from, to, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId };
    
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Expense.countDocuments(query),
    ]);

    res.json({ expenses, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/expenses
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, amount, date, paymentMode, vendorName, notes, gstRate = 0, isInterState = false } = req.body;
    
    if (!category || !amount) {
      res.status(400).json({ message: 'Category and Amount are required' });
      return;
    }

    const numAmount = Number(amount);
    const numGstRate = Number(gstRate);
    
    let cgst = 0, sgst = 0, igst = 0;
    if (numGstRate > 0) {
      const taxAmount = (numAmount * numGstRate) / 100;
      if (isInterState) {
        igst = taxAmount;
      } else {
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
      }
    }
    
    const totalWithTax = numAmount + cgst + sgst + igst;

    const expense = await Expense.create({
      businessId: req.user!.businessId,
      category,
      amount: numAmount,
      date: date ? new Date(date) : new Date(),
      paymentMode: paymentMode || 'Cash',
      vendorName,
      notes,
      gstRate: numGstRate,
      cgst, sgst, igst,
      totalWithTax,
      createdBy: req.user!.userId,
    });

    // Record in general ledger + update cash/bank
    await AccountingService.recordExpense(expense);

    res.status(201).json({ message: 'Expense recorded', expense });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/expenses/:id
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!expense) { res.status(404).json({ message: 'Expense not found' }); return; }
    
    // Reverse general ledger + cash/bank
    await AccountingService.reverseExpense(expense);

    res.json({ message: 'Expense deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/expenses/:id
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId;
    const { category, amount, date, paymentMode, vendorName, notes, gstRate = 0, isInterState = false, bankAccountId } = req.body;

    const existing = await Expense.findOne({ _id: id, businessId });
    if (!existing) { res.status(404).json({ message: 'Expense not found' }); return; }

    // 1. Reverse the old accounting entry
    await AccountingService.reverseExpense(existing);

    // 2. Recalculate tax on new amount
    const numAmount = Number(amount);
    const numGstRate = Number(gstRate);
    let cgst = 0, sgst = 0, igst = 0;
    if (numGstRate > 0) {
      const taxAmount = (numAmount * numGstRate) / 100;
      if (isInterState) { igst = taxAmount; }
      else { cgst = taxAmount / 2; sgst = taxAmount / 2; }
    }
    const totalWithTax = numAmount + cgst + sgst + igst;

    // 3. Update the record
    existing.category = category || existing.category;
    existing.amount = numAmount;
    existing.date = date ? new Date(date) : existing.date;
    existing.paymentMode = paymentMode || existing.paymentMode;
    existing.vendorName = vendorName ?? existing.vendorName;
    existing.notes = notes ?? existing.notes;
    existing.gstRate = numGstRate;
    existing.cgst = cgst;
    existing.sgst = sgst;
    existing.igst = igst;
    existing.totalWithTax = totalWithTax;
    if (bankAccountId !== undefined) (existing as any).bankAccountId = bankAccountId || undefined;
    await existing.save();

    // 4. Re-record in the general ledger
    await AccountingService.recordExpense(existing);

    res.json({ message: 'Expense updated', expense: existing });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/expenses/analytics/summary
export const getExpenseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();
    const { period } = req.query as any;
    
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0,0,0,0); }
    else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);

    const [monthExpenses, byCategory] = await Promise.all([
      Expense.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), date: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$totalWithTax' } } },
      ]),
      Expense.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), date: { $gte: startDate } } },
        { $group: { _id: '$category', total: { $sum: '$totalWithTax' } } },
        { $sort: { total: -1 } }
      ])
    ]);

    res.json({
      monthTotal: monthExpenses[0]?.total || 0,
      byCategory
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
