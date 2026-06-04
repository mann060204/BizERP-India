import { Router } from 'express';
import { getExpenses, createExpense, deleteExpense, getExpenseSummary } from '../controllers/expense.controller';
import { protect, checkLockedFY, checkLockedFY } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);
router.use(checkLockedFY);

router.get('/analytics/summary', getExpenseSummary);
router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
