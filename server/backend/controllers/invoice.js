// controllers/invoice.js
import prisma from '../config/prisma.js';
import omise from '../config/omise.js';

// GET all invoices ดึงข้อมูลใบแจ้งหนี้ทั้งหมด
export const getAllInvoices = async (req, res) => {
  try {
    const { roomId, statusId, dormitoryId, month, year } = req.query;
    const where = {};
    
    if (roomId) { where.roomId = parseInt(roomId);}
    if (statusId) { where.statusId = parseInt(statusId);}
    
    if (dormitoryId) {
      where.room = {
        building: { dormitoryId: parseInt(dormitoryId) }
      };
    }
  
    //Filter ตามเดือน/ปี
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.Date = { gte: startDate, lte: endDate };
    }
    
    const invoices = await prisma.invoice.findMany({
      where,
      include: { room: { include: { building: {
              include: { dormitory: true }
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
        },
        receipts: true
      },
      orderBy: {
        Date: 'desc' // เรียงจากใหม่ล่าสุด
      }
    });
    
    // คำนวณยอดรวมของแต่ละใบแจ้งหนี้
    const invoicesWithTotal = invoices.map(invoice => {
      const total = invoice.itemlists.reduce(
        (sum, itemlist) => sum + (itemlist.quantity * itemlist.item.price),
        0
      );
      const paid = invoice.receipts.reduce(
        (sum, receipt) => sum + receipt.amount,
        0
      );
      return {
        ...invoice,
        total,
        paid,
        remaining: total - paid
      };
    });
    
    res.json(invoicesWithTotal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// // GET unpaid invoices ดึงใบแจ้งหนี้ที่ยังไม่ชำระ
// export const getUnpaidInvoices = async (req, res) => {
//   try {
//     const { dormitoryId } = req.query;
    
//     // หาสถานะ "รอชำระ" และ "เกินกำหนด"
//     const unpaidStatuses = await prisma.status.findMany({
//       where: {
//         Type: 'INVOICE',
//         name: {
//           in: ['Pending', 'Pastdue']
//         }
//       }
//     });
    
//     const statusIds = unpaidStatuses.map(s => s.StatusID);
    
//     const where = {
//       statusId: {
//         in: statusIds
//       }
//     };
    
//     if (dormitoryId) {
//       where.room = {
//         building: {
//           dormitoryId: parseInt(dormitoryId)
//         }
//       };
//     }
    
//     const invoices = await prisma.invoice.findMany({
//       where,
//       include: {
//         room: {
//           include: {
//             building: {
//               include: {
//                 dormitory: true
//               }
//             },
//             contracts: {
//               where: {
//                 DayEnd: {
//                   gte: new Date()
//                 }
//               },
//               include: {
//                 user: true
//               }
//             }
//           }
//         },
//         status: true,
//         itemlists: {
//           include: {
//             item: true
//           }
//         },
//         receipts: true
//       },
//       orderBy: {
//         Date: 'asc' // เรียงจากเก่าล่าสุดก่อน (ค้างนานสุดก่อน)
//       }
//     });
    
//     // คำนวณยอดรวม
//     const invoicesWithTotal = invoices.map(invoice => {
//       const total = invoice.itemlists.reduce(
//         (sum, itemlist) => sum + (itemlist.quantity * itemlist.item.price),
//         0
//       );
//       const paid = invoice.receipts.reduce(
//         (sum, receipt) => sum + receipt.amount,
//         0
//       );
//       return {
//         ...invoice,
//         total,
//         paid,
//         remaining: total - paid
//       };
//     });
    
//     res.json(invoicesWithTotal);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// GET invoice by ID ดึงข้อมูลใบแจ้งหนี้ตาม ID
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { InvoiceID: parseInt(id) },
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
                user: {
                  include: {
                    roommates: true
                  }
                }
              }
            }
          }
        },
        status: true,
        itemlists: {
          include: {
            item: true
          }
        },
        receipts: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // คำนวณยอดรวม
    const total = invoice.itemlists.reduce(
      (sum, itemlist) => sum + (itemlist.quantity * itemlist.item.price),
      0
    );
    const paid = invoice.receipts.reduce(
      (sum, receipt) => sum + receipt.amount,
      0
    );
    
    res.json({
      ...invoice,
      total,
      paid,
      remaining: total - paid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST create invoice สร้างใบแจ้งหนี้ใหม่ พร้อมรายการค่าใช้จ่าย
export const createInvoice = async (req, res) => {
  try {
    const { Date: invoiceDate, roomId, userId, statusId, items } = req.body;

    const missingFields = [];

    if (!invoiceDate) missingFields.push("Invoice date");
    if (!roomId) missingFields.push("Room ID");
    if (!statusId) missingFields.push("Status ID");
    if (!userId) missingFields.push("User ID");
    if (!items || !Array.isArray(items) || items.length === 0) missingFields.push("Items");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required field(s): ${missingFields.join(", ")}`
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Items must be a non-empty array'
      });
    }

    // ตรวจสอบว่าห้องมีอยู่จริง
    const room = await prisma.room.findUnique({
      where: { RoomID: parseInt(roomId) }
    });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // ตรวจสอบว่าเป็น INVOICE status
    const status = await prisma.status.findFirst({
      where: { StatusID: parseInt(statusId), Type: 'INVOICE' }
    });
    if (!status) return res.status(404).json({ error: 'Invoice status not found' });

    // ตรวจสอบ user
    const user = await prisma.user.findUnique({
      where: { UserID: parseInt(userId) }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // สร้าง invoice พร้อม itemlists
    const invoice = await prisma.invoice.create({
      data: {
        Date: new Date(invoiceDate),
        roomId: parseInt(roomId),
        userId: parseInt(userId),
        statusId: parseInt(statusId),
        itemlists: {
          create: items.map(i => ({
            itemId: parseInt(i.itemId),
            quantity: parseFloat(i.quantity)
          }))
        }
      },
      include: {
        user: true,
        room: { include: { building: { include: { dormitory: true } } } },
        status: true,
        itemlists: { include: { item: true } }
      }
    });

    // คำนวณยอดรวม
    const total = invoice.itemlists.reduce(
      (sum, itemlist) => sum + itemlist.quantity * itemlist.item.price,
      0
    );

    res.status(201).json({
      ...invoice,
      total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// อัพเดทสถานะใบแจ้งหนี้ (เช่น จาก "รอชำระ" เป็น "ชำระแล้ว")
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;
    
    if (!statusId) {
      return res.status(400).json({ error: 'Status ID is required' });
    }
    
    // ตรวจสอบว่าเป็น INVOICE status
    const status = await prisma.status.findFirst({
      where: { 
        StatusID: parseInt(statusId),
        Type: 'INVOICE'
      }
    });
    if (!status) {
      return res.status(404).json({ error: 'Invoice status not found' });
    }
    
    const invoice = await prisma.invoice.update({
      where: { InvoiceID: parseInt(id) },
      data: {
        statusId: parseInt(statusId)
      },
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
        },
        receipts: true
      }
    });
    
    res.json(invoice);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// DELETE invoice ลบใบแจ้งหนี้ (จะลบ itemlists และ receipts ที่เชื่อมด้วย)
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ลบใบแจ้งหนี้พร้อม itemlists และ receipts (Transaction)
    await prisma.$transaction(async (tx) => {
      // ลบ receipts
      await tx.receipt.deleteMany({
        where: { invoiceId: parseInt(id) }
      });
      
      // ลบ itemlists
      await tx.itemList.deleteMany({
        where: { invoiceId: parseInt(id) }
      });
      
      // ลบ invoice
      await tx.invoice.delete({
        where: { InvoiceID: parseInt(id) }
      });
    });
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// GET all invoices for logged-in user
export const getInvoicesForUser = async (req, res) => {
  try {
    const { authId } = req.params;

    // หาผู้ใช้จาก authId
    const user = await prisma.user.findUnique({
      where: { authId }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // ดึง invoice ของ user
    const invoices = await prisma.invoice.findMany({
      where: {
        room: {
          contracts: {
            some: {
              userId: user.UserID, // ✅ ใช้ userId
              DayEnd: { gte: new Date() }
            }
          }
        }
      },
      include: {
        room: {
          include: {
            building: { include: { dormitory: true } },
            contracts: { include: { user: true } }
          }
        },
        status: true,
        itemlists: { include: { item: true } },
        receipts: { orderBy: { date: 'desc' } }
      },
      orderBy: { InvoiceID: 'desc' }
    });

    // const result = invoices.map(inv => {
    //   const total = inv.itemlists.reduce((sum, itemlist) => sum + (itemlist.quantity * itemlist.item.price), 0);
    //   const paid = inv.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    //   return { ...inv, total, paid, remaining: total - paid };
    // });
    const result = invoices.map(inv => {
      const itemsTotal = inv.itemlists.reduce(
        (sum, itemlist) => sum + itemlist.quantity * itemlist.item.price,
        0
      );
      const roomPrice = inv.room?.price || 0; // ดึงค่าเช่าห้อง, ถ้าไม่มีให้เป็น 0
      const total = itemsTotal + roomPrice; // รวมค่าเช่าห้องด้วย
      const paid = inv.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
      return { ...inv, total, paid, remaining: total - paid };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงใบแจ้งหนี้ทั้งหมด (รองรับ filter)
// export const getAllInvoices = async (req, res) => {
//   try {
//     const { roomId, statusId, dormitoryId, month, year } = req.query;
//     const where = {};

//     if (roomId) where.roomId = parseInt(roomId);
//     if (statusId) where.statusId = parseInt(statusId);
//     if (dormitoryId) {
//       where.room = { building: { dormitoryId: parseInt(dormitoryId) } };
//     }
//     if (month && year) {
//       const start = new Date(year, month - 1, 1);
//       const end = new Date(year, month, 0);
//       where.Date = { gte: start, lte: end };
//     }

//     const invoices = await prisma.invoice.findMany({
//       where,
//       include: {
//         room: { include: { building: true } },
//         user: true,
//         status: true,
//         itemlists: { include: { item: true } },
//         receipts: true,
//       },
//     });

//     res.json(invoices);
//   } catch (error) {
//     console.error("❌ getAllInvoices Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

//ดึงใบแจ้งหนี้ตาม ID
// export const getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const invoice = await prisma.invoice.findUnique({
//       where: { InvoiceID: parseInt(id) },
//       include: {
//         room: { include: { building: true } },
//         user: true,
//         status: true,
//         itemlists: { include: { item: true } },
//         receipts: true,
//       },
//     });

//     if (!invoice) return res.status(404).json({ error: "Invoice not found" });
//     res.json(invoice);
//   } catch (error) {
//     console.error("❌ getInvoiceById Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

//สร้างใบแจ้งหนี้ใหม่
// export const createInvoice = async (req, res) => {
//   try {
//     const { Date, roomId, userId, statusId, items } = req.body;

//     const invoice = await prisma.invoice.create({
//       data: {
//         Date: new Date(Date),
//         roomId,
//         userId,
//         statusId,
//         itemlists: {
//           create: items.map((item) => ({
//             itemId: item.itemId,
//             quantity: item.quantity,
//           })),
//         },
//       },
//     });

//     res.status(201).json(invoice);
//   } catch (error) {
//     console.error("❌ createInvoice Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

//สร้าง QR Code เพื่อชำระเงิน
export const createInvoicePayment = async (req, res) => {
  try {
    const { invoiceId, amount } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { InvoiceID: parseInt(invoiceId) },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    // 🔹 สร้าง Source ผ่าน Omise
    const source = await omiseClient.sources.create({
      type: "promptpay",
      amount: Math.round(amount * 100), // แปลงบาทเป็นสตางค์
      currency: "thb",
    });

    // 🔹 อัปเดต Invoice ด้วย QR ที่สร้างได้
    const updatedInvoice = await prisma.invoice.update({
      where: { InvoiceID: invoice.InvoiceID },
      data: {
        sourceId: source.id,
        qrUrl: source.scannable_code.image.download_uri,
        statusId: 2, // Pending
      },
    });

    res.status(201).json(updatedInvoice);
  } catch (error) {
    console.error("❌ createInvoicePayment Error:", error);
    res.status(500).json({ error: error.message });
  }
};

//ยืนยันการชำระเงิน (หลังลูกค้าสแกนจ่ายแล้ว)
export const confirmInvoicePayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { InvoiceID: parseInt(invoiceId) },
    });

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    if (!invoice.sourceId) return res.status(400).json({ error: "No payment source" });

    // 🔹 สร้าง Charge เพื่อเรียก Omise ตรวจสถานะ
    const charge = await omiseClient.charges.create({
      amount: Math.round(5000 * 100), // ✅ ใช้ยอดจริงของ invoice
      currency: "thb",
      source: invoice.sourceId,
    });

    const updated = await prisma.invoice.update({
      where: { InvoiceID: invoice.InvoiceID },
      data: {
        chargeId: charge.id,
        statusId: charge.paid ? 3 : 4, // 3 = Paid, 4 = Failed
      },
    });

    res.json({ message: "Payment updated", invoice: updated });
  } catch (error) {
    console.error("❌ confirmInvoicePayment Error:", error);
    res.status(500).json({ error: error.message });
  }
};

//อัปเดตสถานะใบแจ้งหนี้ (manual)
// export const updateInvoiceStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { statusId } = req.body;

//     const updated = await prisma.invoice.update({
//       where: { InvoiceID: parseInt(id) },
//       data: { statusId },
//     });

//     res.json(updated);
//   } catch (error) {
//     console.error("❌ updateInvoiceStatus Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

//ลบใบแจ้งหนี้
// export const deleteInvoice = async (req, res) => {
//   try {
//     const { id } = req.params;

//     await prisma.invoice.delete({
//       where: { InvoiceID: parseInt(id) },
//     });

//     res.json({ message: "Invoice deleted" });
//   } catch (error) {
//     console.error("❌ deleteInvoice Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };
