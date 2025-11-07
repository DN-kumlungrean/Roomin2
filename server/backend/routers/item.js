import express from 'express';
import {
  getAllItems,
  getActiveItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/item.js';

const router = express.Router();

router.get('/items', getAllItems);
router.get('/items/active', getActiveItems);
router.get('/items/:id', getItemById);
router.post('/items', createItem);
router.put('/items/:id', updateItem);
router.delete('items/:id', deleteItem);

export default router;