// controllers/receiptController.js
import prisma from '../config/prisma.js';
import path from 'path';  // ✅ เพิ่มบรรทัดนี้
import fs from 'fs';      // ✅ เพิ่มบรรทัดนี้
// GET all receipts
// ดึงข้อมูลใบเสร็จทั้งหมด
export const getAllReceipts = async (req, res) => {
  try {
    const { invoiceId, startDate, endDate } = req.query;
    
    const where = {};
    
    if (invoiceId) {
      where.invoiceId = parseInt(invoiceId);
    }
    
    // Filter ตามช่วงวันที่
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        invoice: {
          include: {
            room: {
              include: {
                building: {
                  include: {
                    dormitory: true
                  }
                },
                contracts: {
                  where: {
                    DayEnd: {
                      gte: new Date()
                    }
                  },
                  include: {
                    user: true
                  }
                }
              }
            },
            status: true,
            itemlists: {
              include: {
                item: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc' // เรียงจากใหม่ล่าสุด
      }
    });
    
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET receipt by ID
// ดึงข้อมูลใบเสร็จตาม ID
export const getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const receipt = await prisma.receipt.findUnique({
      where: { ReceiptID: parseInt(id) },
      include: {
        invoice: {
          include: {
            room: {
              include: {
                building: {
                  include: {
                    dormitory: true
                  }
                },
                contracts: {
                  where: {
                    DayEnd: {
                      gte: new Date()
                    }
                  },
                  include: {
                    user: true
                  }
                }
              }
            },
            status: true,
            itemlists: {
              include: {
                item: true
              }
            }
          }
        }
      }
    });
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET receipts by invoice
// ดึงใบเสร็จทั้งหมดของใบแจ้งหนี้หนึ่ง
export const getReceiptsByInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const receipts = await prisma.receipt.findMany({
      where: {
        invoiceId: parseInt(invoiceId)
      },
      orderBy: {
        date: 'asc' // เรียงจากเก่าไปใหม่
      }
    });
    
    // คำนวณยอดรวมที่ชำระแล้ว
    const totalPaid = receipts.reduce(
      (sum, receipt) => sum + receipt.amount,
      0
    );
    
    res.json({
      receipts,
      summary: {
        totalReceipts: receipts.length,
        totalPaid
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const createReceipt = async (req, res) => {
  try {
    console.log('🔍 Request received:', {
      body: req.body,
      file: req.file
    });

    const file = req.file;     
    if (!file) {
      return res.status(400).json({ error: 'Payment slip file is required.' });
    }
    
    const { amount, date, invoiceId } = req.body;

    // Validation
    if (!amount || !date || !invoiceId) {
      // ลบไฟล์ที่อัปโหลดแล้วถ้า validation ไม่ผ่าน
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        error: 'Amount, date, and invoice ID are required',
        received: { amount, date, invoiceId }
      });
    }

    // ตรวจสอบว่าใบแจ้งหนี้มีอยู่จริง
    const invoice = await prisma.invoice.findUnique({
      where: { InvoiceID: parseInt(invoiceId) },
      include: {
        itemlists: {
          include: {
            item: true
          }
        },
        receipts: true,
        status: true
      }
    });
    
    if (!invoice) {
      // ลบไฟล์ที่อัปโหลดแล้วถ้าไม่เจอ invoice
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // ✅ เปลี่ยนชื่อไฟล์ให้มี invoiceId
    const oldPath = file.path;
    const ext = path.extname(file.originalname);
    const newFilename = `${invoiceId}_${Date.now()}${ext}`;
    const newPath = path.join(path.dirname(oldPath), newFilename);
    
    // Rename file
    fs.renameSync(oldPath, newPath);
    
    const fileUrl = `/uploads/${newFilename}`;
    console.log('✅ File saved as:', fileUrl);

    // คำนวณยอดรวมและยอดที่ชำระแล้ว
    const totalAmount = invoice.itemlists.reduce(
      (sum, itemlist) => sum + (itemlist.quantity * itemlist.item.price),
      0
    );
    
    const paidAmount = invoice.receipts.reduce(
      (sum, receipt) => sum + receipt.amount,
      0
    );
    
    const remaining = totalAmount - paidAmount;

    // ตรวจสอบว่ายอดที่จะชำระไม่เกินยอดคงเหลือ
    if (parseFloat(amount) > remaining) {
      // ลบไฟล์ถ้ายอดเกิน
      fs.unlinkSync(newPath);
      return res.status(400).json({ 
        error: `Payment amount exceeds remaining balance. Remaining: ${remaining}` 
      });
    }
    
    // หาสถานะ "ชำระแล้ว"
    const paidStatus = await prisma.status.findFirst({
      where: {
        Type: 'INVOICE',
        name: 'ชำระแล้ว'
      }
    });

    // สร้างใบเสร็จและอัพเดทสถานะใบแจ้งหนี้ (ถ้าชำระครบ) พร้อมกัน
    const receipt = await prisma.$transaction(async (tx) => {
      // สร้างใบเสร็จ
      const newReceipt = await tx.receipt.create({
        data: {
          amount: parseFloat(amount),
          date: new Date(date),
          proof: fileUrl,
          invoiceId: parseInt(invoiceId)
        },
        include: {
          invoice: {
            include: {
              room: {
                include: {
                  building: {
                    include: {
                      dormitory: true
                    }
                  }
                }
              },
              status: true,
              itemlists: {
                include: {
                  item: true
                }
              }
            }
          }
        }
      });

      // ตรวจสอบว่าชำระครบหรือยัง
      const newPaidAmount = paidAmount + parseFloat(amount);
      
      // ถ้าชำระครบ อัพเดทสถานะเป็น "ชำระแล้ว"
      if (newPaidAmount >= totalAmount && paidStatus) {
        await tx.invoice.update({
          where: { InvoiceID: parseInt(invoiceId) },
          data: {
            statusId: paidStatus.StatusID
          }
        });
      }
      
      return newReceipt;
    });
    
    console.log('✅ Receipt created successfully:', receipt.ReceiptID);
    res.status(201).json({ success: true, receipt });

  } catch (error) {
    console.error('❌ Error in createReceipt:', error);
    
    // ลบไฟล์ถ้าเกิด error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: error.message
    });
  }
};


// PUT update receipt
// อัพเดทข้อมูลใบเสร็จ
export const updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, proof } = req.body;
    
    // ถ้ามีการเปลี่ยนจำนวนเงิน ต้องตรวจสอบว่าไม่เกินยอดใบแจ้งหนี้
    if (amount) {
      const receipt = await prisma.receipt.findUnique({
        where: { ReceiptID: parseInt(id) },
        include: {
          invoice: {
            include: {
              itemlists: {
                include: {
                  item: true
                }
              },
              receipts: true
            }
          }
        }
      });
      
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }
      
      // คำนวณยอดรวม
      const totalAmount = receipt.invoice.itemlists.reduce(
        (sum, itemlist) => sum + (itemlist.quantity * itemlist.item.price),
        0
      );
      
      // คำนวณยอดที่ชำระแล้ว (ไม่รวมใบเสร็จนี้)
      const otherReceiptsTotal = receipt.invoice.receipts
        .filter(r => r.ReceiptID !== parseInt(id))
        .reduce((sum, r) => sum + r.amount, 0);
      
      const newTotal = otherReceiptsTotal + parseFloat(amount);
      
      if (newTotal > totalAmount) {
        return res.status(400).json({ 
          error: `Total payments would exceed invoice amount. Max allowed: ${totalAmount - otherReceiptsTotal}` 
        });
      }
    }
    
    const receipt = await prisma.receipt.update({
      where: { ReceiptID: parseInt(id) },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(proof !== undefined && { proof })
      },
      include: {
        invoice: {
          include: {
            room: {
              include: {
                building: {
                  include: {
                    dormitory: true
                  }
                }
              }
            },
            status: true
          }
        }
      }
    });
    
    res.json(receipt);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// DELETE receipt
// ลบใบเสร็จ (อาจต้องอัพเดทสถานะใบแจ้งหนี้กลับเป็น "รอชำระ")
export const deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ดึงข้อมูลใบเสร็จก่อนลบ
    const receipt = await prisma.receipt.findUnique({
      where: { ReceiptID: parseInt(id) },
      include: {
        invoice: {
          include: {
            itemlists: {
              include: {
                item: true
              }
            },
            receipts: true,
            status: true
          }
        }
      }
    });
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    // หาสถานะ "รอชำระ"
    const pendingStatus = await prisma.status.findFirst({
      where: {
        Type: 'INVOICE',
        name: 'รอชำระ'
      }
    });
    
    // ลบใบเสร็จและอัพเดทสถานะใบแจ้งหนี้ถ้าจำเป็น
    await prisma.$transaction(async (tx) => {
      // ลบใบเสร็จ
      await tx.receipt.delete({
        where: { ReceiptID: parseInt(id) }
      });
      
      // คำนวณยอดหลังลบใบเสร็จนี้
      const totalAmount = receipt.invoice.itemlists.reduce(
        (sum, itemlist) => sum + (itemlist.quantity * itemlist.item.price),
        0
      );
      
      const remainingPaid = receipt.invoice.receipts
        .filter(r => r.ReceiptID !== parseInt(id))
        .reduce((sum, r) => sum + r.amount, 0);
      
      // ถ้าชำระไม่ครบแล้ว เปลี่ยนสถานะกลับเป็น "รอชำระ"
      if (remainingPaid < totalAmount && pendingStatus) {
        await tx.invoice.update({
          where: { InvoiceID: receipt.invoiceId },
          data: {
            statusId: pendingStatus.StatusID
          }
        });
      }
    });
    
    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.status(500).json({ error: error.message });
  }
};