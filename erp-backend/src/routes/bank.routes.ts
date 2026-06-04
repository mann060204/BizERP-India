import express from 'express';
import { getBanks, getBankById, createBank, updateBank, deleteBank } from '../controllers/bank.controller';
import { protect, checkLockedFY, checkLockedFY } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect);
router.use(checkLockedFY);

router.route('/')
  .get(getBanks)
  .post(createBank);

router.route('/:id')
  .get(getBankById)
  .put(updateBank)
  .delete(deleteBank);

export default router;
