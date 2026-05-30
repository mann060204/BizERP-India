import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Account from '../models/Account.model';
import AccountLedger from '../models/AccountLedger.model';

export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const query: any = { businessId: req.user!.businessId };
    if (type) query.type = type;

    const accounts = await Account.find(query).sort({ createdAt: -1 });
    res.json({ accounts });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, bankName, type, accountNumber, openingBalance, balanceType } = req.body;
    const businessId = req.user!.businessId;

    const account = await Account.create({
      businessId,
      name,
      bankName,
      type,
      accountNumber,
      openingBalance: Number(openingBalance) || 0,
      balanceType: balanceType || 'Dr',
      currentBalance: Number(openingBalance) || 0
    });

    if (account.openingBalance > 0) {
      await AccountLedger.create({
        businessId,
        accountId: account._id,
        date: new Date(),
        description: 'Opening Balance',
        debit: account.balanceType === 'Dr' ? account.openingBalance : 0,
        credit: account.balanceType === 'Cr' ? account.openingBalance : 0,
        referenceType: 'Opening',
        closingBalance: account.openingBalance
      });
    }

    res.status(201).json({ message: 'Account created', account });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const getAccountLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { from, to } = req.query as any;
    const businessId = req.user!.businessId;

    const account = await Account.findOne({ _id: id, businessId });
    if (!account) { res.status(404).json({ message: 'Account not found' }); return; }

    const query: any = { businessId, accountId: id };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const ledger = await AccountLedger.find(query).sort({ date: 1, createdAt: 1 });

    // Calculate opening balance for the period if date filter is applied
    let periodOpeningBalance = 0;
    if (from) {
      const prevTransactions = await AccountLedger.find({
        businessId,
        accountId: id,
        date: { $lt: new Date(from) }
      });
      const totalDr = prevTransactions.reduce((acc, curr) => acc + (curr.debit || 0), 0);
      const totalCr = prevTransactions.reduce((acc, curr) => acc + (curr.credit || 0), 0);
      periodOpeningBalance = account.balanceType === 'Dr' ? totalDr - totalCr : totalCr - totalDr;
    } else {
      periodOpeningBalance = 0; // If no date filter, the 'Opening Balance' ledger entry is the start
    }

    res.json({ account, ledger, periodOpeningBalance });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const addTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, description, debit, credit, referenceType } = req.body;
    const businessId = req.user!.businessId;

    const account = await Account.findOne({ _id: id, businessId });
    if (!account) { res.status(404).json({ message: 'Account not found' }); return; }

    const d = Number(debit) || 0;
    const c = Number(credit) || 0;

    // Update account balance
    if (account.balanceType === 'Dr') {
      account.currentBalance += d - c;
    } else {
      account.currentBalance += c - d;
    }
    await account.save();

    const transaction = await AccountLedger.create({
      businessId,
      accountId: id,
      date: new Date(date),
      description,
      debit: d,
      credit: c,
      referenceType: referenceType || 'Adjustment',
      closingBalance: account.currentBalance
    });

    res.status(201).json({ message: 'Transaction added', transaction, account });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, bankName, accountNumber, openingBalance, balanceType } = req.body;
    const businessId = req.user!.businessId;

    const account = await Account.findOne({ _id: id, businessId });
    if (!account) { res.status(404).json({ message: 'Account not found' }); return; }

    const oldOpeningBalance = account.openingBalance || 0;
    const oldBalanceType = account.balanceType || 'Dr';
    const newOpeningBalance = Number(openingBalance) || 0;
    const newBalanceType = balanceType || 'Dr';

    account.name = name;
    if (bankName !== undefined) account.bankName = bankName;
    if (accountNumber !== undefined) account.accountNumber = accountNumber;

    if (oldOpeningBalance !== newOpeningBalance || oldBalanceType !== newBalanceType) {
      let diff = 0;
      
      // Remove old opening balance effect from Dr perspective
      if (oldBalanceType === 'Dr') diff -= oldOpeningBalance;
      else diff += oldOpeningBalance;

      // Add new opening balance effect to Dr perspective
      if (newBalanceType === 'Dr') diff += newOpeningBalance;
      else diff -= newOpeningBalance;

      if (account.balanceType === 'Dr') {
        account.currentBalance += diff;
      } else {
        account.currentBalance -= diff;
      }
      
      account.openingBalance = newOpeningBalance;
      account.balanceType = newBalanceType;

      let openingLedger = await AccountLedger.findOne({ accountId: id, referenceType: 'Opening' });
      if (openingLedger) {
        if (newOpeningBalance === 0) {
          await AccountLedger.deleteOne({ _id: openingLedger._id });
        } else {
          openingLedger.debit = newBalanceType === 'Dr' ? newOpeningBalance : 0;
          openingLedger.credit = newBalanceType === 'Cr' ? newOpeningBalance : 0;
          openingLedger.closingBalance = newOpeningBalance;
          await openingLedger.save();
        }
      } else if (newOpeningBalance > 0) {
        await AccountLedger.create({
          businessId,
          accountId: account._id,
          date: account.createdAt,
          description: 'Opening Balance',
          debit: newBalanceType === 'Dr' ? newOpeningBalance : 0,
          credit: newBalanceType === 'Cr' ? newOpeningBalance : 0,
          referenceType: 'Opening',
          closingBalance: newOpeningBalance
        });
      }
    }

    await account.save();

    res.json({ message: 'Account updated', account });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const businessId = req.user!.businessId;

    if (force !== 'true') {
      // Check if there are transactions other than opening balance
      const txCount = await AccountLedger.countDocuments({ accountId: id, referenceType: { $ne: 'Opening' } });
      if (txCount > 0) {
        res.status(400).json({ message: 'HAS_TRANSACTIONS', error: 'Cannot delete account with existing transactions' });
        return;
      }
    }

    const account = await Account.findOneAndDelete({ _id: id, businessId });
    if (!account) { res.status(404).json({ message: 'Account not found' }); return; }

    // Clean up ledgers
    await AccountLedger.deleteMany({ accountId: id, businessId });

    res.json({ message: 'Account deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, txnId } = req.params;
    const businessId = req.user!.businessId;

    const account = await Account.findOne({ _id: id, businessId });
    if (!account) { res.status(404).json({ message: 'Account not found' }); return; }

    const transaction = await AccountLedger.findOne({ _id: txnId, accountId: id, businessId });
    if (!transaction) { res.status(404).json({ message: 'Transaction not found' }); return; }

    if (transaction.referenceType === 'Opening') {
      res.status(400).json({ message: 'Cannot delete the opening balance transaction directly' });
      return;
    }

    // Revert the balance
    if (account.balanceType === 'Dr') {
      account.currentBalance -= (transaction.debit || 0) - (transaction.credit || 0);
    } else {
      account.currentBalance -= (transaction.credit || 0) - (transaction.debit || 0);
    }
    
    await account.save();
    await transaction.deleteOne();

    res.json({ message: 'Transaction deleted successfully', account });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const transferFunds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromAccountId, toAccountId, amount, date, description } = req.body;
    const businessId = req.user!.businessId;

    if (fromAccountId === toAccountId) {
      res.status(400).json({ message: 'Cannot transfer to the same account' });
      return;
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, businessId });
    const toAccount = await Account.findOne({ _id: toAccountId, businessId });

    if (!fromAccount || !toAccount) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      res.status(400).json({ message: 'Invalid amount' });
      return;
    }

    // From Account gets Credited
    if (fromAccount.balanceType === 'Dr') {
      fromAccount.currentBalance -= amt;
    } else {
      fromAccount.currentBalance += amt;
    }
    await fromAccount.save();

    // To Account gets Debited
    if (toAccount.balanceType === 'Dr') {
      toAccount.currentBalance += amt;
    } else {
      toAccount.currentBalance -= amt;
    }
    await toAccount.save();

    const transferRefId = Math.random().toString(36).substring(7); // simple random ref

    await AccountLedger.create({
      businessId,
      accountId: fromAccountId,
      date: new Date(date),
      description: description || `Transfer to ${toAccount.name}`,
      debit: 0,
      credit: amt,
      referenceType: 'Transfer',
      referenceId: transferRefId,
      closingBalance: fromAccount.currentBalance
    });

    await AccountLedger.create({
      businessId,
      accountId: toAccountId,
      date: new Date(date),
      description: description || `Transfer from ${fromAccount.name}`,
      debit: amt,
      credit: 0,
      referenceType: 'Transfer',
      referenceId: transferRefId,
      closingBalance: toAccount.currentBalance
    });

    res.json({ message: 'Transfer successful' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
