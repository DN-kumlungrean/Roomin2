// routes/roommateRoutes.js
import express from 'express';
import {
  getAllRoommates,
  getRoommateById,
  getRoommatesByTenant,
  createRoommate,
  updateRoommate,
  deleteRoommate
} from '../controllers/roommate.js';

const router = express.Router();

router.get('/roommate', getAllRoommates);
router.get('/user/:userId', getRoommatesByTenant);
router.get('/roommate/:id', getRoommateById);
router.post('/roommate', createRoommate);
router.put('/roommate/:id', updateRoommate);
router.delete('/roommate/:id', deleteRoommate);

export default router;