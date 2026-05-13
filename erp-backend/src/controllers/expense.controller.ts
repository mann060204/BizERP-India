import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Expense from '../models/Expense.model';

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

    res.status(201).json({ message: 'Expense recorded', expense });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/expenses/:id
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!expense) { res.status(404).json({ message: 'Expense not found' }); return; }
    res.json({ message: 'Expense deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/expenses/analytics/summary
export const getExpenseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthExpenses, byCategory] = await Promise.all([
      Expense.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalWithTax' } } },
      ]),
      Expense.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), date: { $gte: startOfMonth } } },
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
