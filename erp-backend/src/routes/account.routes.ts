import { Router } from 'express';
import {
  getAccounts,
  createAccount,
  getAccountLedger,
  addTransaction,
  updateAccount,
  deleteAccount,
  deleteTransaction,
  transferFunds
} from '../controllers/account.controller';
import { protect, checkLockedFY } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.use(checkLockedFY);

router.get('/', getAccounts);
router.post('/', createAccount);
router.post('/transfer', transferFunds);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.get('/:id/ledger', getAccountLedger);
router.post('/:id/transaction', addTransaction);
router.delete('/:id/transaction/:txnId', deleteTransaction);

export default router;
