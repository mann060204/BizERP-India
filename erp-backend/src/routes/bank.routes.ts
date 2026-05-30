import express from 'express';
import { getBanks, getBankById, createBank, updateBank, deleteBank } from '../controllers/bank.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBanks)
  .post(createBank);

router.route('/:id')
  .get(getBankById)
  .put(updateBank)
  .delete(deleteBank);

export default router;
