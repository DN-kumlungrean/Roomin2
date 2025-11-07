// routes/itemListRoutes.js
import express from 'express';
import {
  getAllItemLists,
  getItemListById,
  getItemListsByInvoice,
  createItemList,
  updateItemList,
  deleteItemList
} from '../controllers/itemList.js';

const router = express.Router();

router.get('/itemLists', getAllItemLists);
router.get('/itemLists/invoice/:invoiceId', getItemListsByInvoice);
router.get('/itemLists/:id', getItemListById);
router.post('/itemLists', createItemList);
router.put('/itemLists/:id', updateItemList);
router.delete('/itemLists/:id', deleteItemList);

export default router;