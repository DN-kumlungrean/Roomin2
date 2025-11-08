// routes/users.js
import express from 'express';
import {
  getAllUsers,
  getUserByAuthId,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} from "../controllers/users.js";

const router = express.Router();

router.get("/users/search", getAllUsers);
router.get("/users/id/:id", getUserById);
router.post("/users", createUser);
router.put("/users/id/:id", updateUser);
router.delete("/users/id/:id", deleteUser);

// router.post("/users", createUser);
router.get("/users/:authId", getUserByAuthId);
// router.get("/users/search", getAllUsers);
// router.get("/users/:id", getUserById);
// router.put("/users/:id", updateUser);
// router.delete("/users/:id", deleteUser);

export default router;