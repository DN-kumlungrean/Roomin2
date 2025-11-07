// routes/contractRoutes.js
import express from 'express';
import {
  getAllContracts,
  getActiveContracts,
  getExpiringContracts,
  getContractById,
  createContract,
  updateContract,
  terminateContract,
  deleteContract
} from '../controllers/contract.js';

const router = express.Router();

router.get('/contracts', getAllContracts);
router.get('/contracts/active', getActiveContracts);
router.get('/contracts/expiring', getExpiringContracts);
router.get('/contracts/:id', getContractById);
router.post('/contracts', createContract);
router.put('/contracts/:id', updateContract);
router.patch('/contracts/:id/terminate', terminateContract);
router.delete('/contracts/:id', deleteContract);

export default router;