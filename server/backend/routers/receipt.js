// routes/receiptRoutes.js
import express from 'express';
import {
  getAllReceipts,
  getReceiptById,
  getReceiptsByInvoice,
  createReceipt,
  updateReceipt,
  deleteReceipt
} from '../controllers/receipt.js';

const router = express.Router();

router.get('/receipts', getAllReceipts);
router.get('/receipts/invoice/:invoiceId', getReceiptsByInvoice);
router.get('/receipts/:id', getReceiptById);
router.post('/receipts', createReceipt);
router.put('/receipts/:id', updateReceipt);
router.delete('/receipts/:id', deleteReceipt);

export default router;