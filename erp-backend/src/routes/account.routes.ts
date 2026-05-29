import { Router } from 'express';
import {
  getAccounts,
  createAccount,
  getAccountLedger,
  addTransaction
} from '../controllers/account.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getAccounts);
router.post('/', createAccount);
router.get('/:id/ledger', getAccountLedger);
router.post('/:id/transaction', addTransaction);

export default router;
