import express from "express";
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  createInvoicePayment,
  confirmInvoicePayment,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoicesForUser,
} from "../controllers/invoice.js";

const router = express.Router();

router.get("/invoices", getAllInvoices);
router.get("/invoices/:id", getInvoiceById);
router.post("/invoices", createInvoice);
router.post("/invoices/payment", createInvoicePayment);
router.post("/invoices/:invoiceId/confirm", confirmInvoicePayment);
router.patch("/invoices/:id/status", updateInvoiceStatus);
router.delete("/invoices/:id", deleteInvoice);
router.get("/invoices/user/:authId", getInvoicesForUser);

export default router;
