import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllReceipts,
  getReceiptById,
  getReceiptsByInvoice,
  createReceipt,
  updateReceipt,
  deleteReceipt
} from '../controllers/receipt.js';

const router = express.Router();

// ✅ สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // ✅ ใช้ timestamp แทน invoiceId เพื่อป้องกันปัญหา 'unknown'
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const filename = `receipt_${timestamp}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
        }
    }
});

// Routes
router.get('/receipts', getAllReceipts);
router.get('/receipts/invoice/:invoiceId', getReceiptsByInvoice);
router.get('/receipts/:id', getReceiptById);
router.post('/receipts', upload.single('file'), createReceipt);
router.put('/receipts/:id', updateReceipt);
router.delete('/receipts/:id', deleteReceipt);

export default router;