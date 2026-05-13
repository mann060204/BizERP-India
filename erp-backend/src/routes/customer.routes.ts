import { Router } from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, createBulkCustomers } from '../controllers/customer.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
router.use(protect);

router.post('/bulk', createBulkCustomers);
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
