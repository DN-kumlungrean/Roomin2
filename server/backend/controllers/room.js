import prisma from '../config/prisma.js';

// GET all rooms
// ดึงข้อมูลห้องทั้งหมด สามารถ filter ได้หลายแบบ
export const getAllRooms = async (req, res) => {
  try {
    const { buildingId, statusId, minPrice, maxPrice, dormitoryId } = req.query;
    
    // สร้าง where clause แบบ dynamic ตามเงื่อนไขที่ส่งมา
    const where = {};
    
    if (buildingId) {
      where.buildingId = parseInt(buildingId);
    }
    
    if (dormitoryId) {
      where.building = {
        dormitoryId: parseInt(dormitoryId)
      };
    }
    
    if (statusId) {
      where.statusId = parseInt(statusId);
    }
    
    // ค้นหาห้องตามช่วงราคา
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice); // gte = มากกว่าหรือเท่ากับ
      if (maxPrice) where.price.lte = parseFloat(maxPrice); // lte = น้อยกว่าหรือเท่ากับ
    }
    
    const rooms = await prisma.room.findMany({
      where,
      include: {
        building: {
          include: {
            dormitory: true
          }
        },
        status: true,
        contracts: {
          where: {
            DayEnd: {
              gte: new Date() // เฉพาะสัญญาที่ยังใช้งาน
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
      },
      orderBy: {
        price: 'asc' // เรียงตามราคาจากน้อยไปมาก
      }
    });
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET available rooms
// ดึงเฉพาะห้องที่ว่าง
export const getAvailableRooms = async (req, res) => {
  try {
    const { dormitoryId, buildingId, minPrice, maxPrice } = req.query;
    
    // หาสถานะ "ว่าง" จากตาราง Status
    const availableStatus = await prisma.status.findFirst({
      where: {
        Type: 'ROOM',
        name: 'Available'
      }
    });
    
    if (!availableStatus) {
      return res.status(500).json({ error: 'Available status not found in database' });
    }
    
    const where = {
      statusId: availableStatus.StatusID
    };
    
    // Filter ตามอาคารหรือหอพัก
    if (buildingId) {
      where.buildingId = parseInt(buildingId);
    } else if (dormitoryId) {
      where.building = {
        dormitoryId: parseInt(dormitoryId)
      };
    }
    
    // Filter ตามช่วงราคา
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    
    const rooms = await prisma.room.findMany({
      where,
      include: {
        building: {
          include: {
            dormitory: true
          }
        },
        status: true
      },
      orderBy: {
        price: 'asc'
      }
    });
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET room by ID
// ดึงข้อมูลห้องตาม ID พร้อมประวัติทั้งหมด (สัญญา, ใบแจ้งหนี้)
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await prisma.room.findUnique({
      where: { RoomID: parseInt(id) },
      include: {
        building: {
          include: {
            dormitory: true
          }
        },
        status: true,
        contracts: {
          include: {
            tenant: {
              include: {
                user: true,
                roommates: true
              }
            }
          },
          orderBy: {
            DayStart: 'desc' // สัญญาใหม่ล่าสุดก่อน
          }
        },
        invoices: {
          include: {
            status: true,
            itemlists: {
              include: {
                item: true
              }
            },
            receipts: true
          },
          orderBy: {
            Date: 'desc' // ใบแจ้งหนี้ใหม่ล่าสุดก่อน
          }
        }
      }
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET room current tenant
// ดึงข้อมูลผู้เช่าปัจจุบันของห้อง
export const getRoomCurrentTenant = async (req, res) => {
  try {
    const { id } = req.params;
    
    // หาสัญญาที่ยังใช้งานอยู่
    const activeContract = await prisma.contract.findFirst({
      where: {
        roomId: parseInt(id),
        DayEnd: {
          gte: new Date()
        }
      },
      include: {
        tenant: {
          include: {
            user: true,
            roommates: true
          }
        },
        room: {
          include: {
            building: {
              include: {
                dormitory: true
              }
            }
          }
        }
      },
      orderBy: {
        DayStart: 'desc' // ถ้ามีหลายสัญญาให้เอาล่าสุด
      }
    });
    
    if (!activeContract) {
      return res.status(404).json({ 
        error: 'No active tenant found for this room' 
      });
    }
    
    res.json(activeContract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST create room
// สร้างห้องใหม่
export const createRoom = async (req, res) => {
  try {
    const { RoomName, price, statusId, buildingId } = req.body;
    
    // Validation
    if (!price || !statusId || !buildingId) {
      return res.status(400).json({ 
        error: 'Price, status ID, and building ID are required' 
      });
    }
    
    // ตรวจสอบว่าอาคารมีอยู่จริง
    const building = await prisma.building.findUnique({
      where: { BuildingID: parseInt(buildingId) }
    });
    
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    // ตรวจสอบว่าสถานะมีอยู่จริง และเป็น Type ROOM
    const status = await prisma.status.findFirst({
      where: { 
        StatusID: parseInt(statusId),
        Type: 'ROOM'
      }
    });
    
    if (!status) {
      return res.status(404).json({ error: 'Room status not found' });
    }
    
    const room = await prisma.room.create({
      data: {
        RoomName: RoomName,
        price: parseFloat(price),
        statusId: parseInt(statusId),
        buildingId: parseInt(buildingId)
      },
      include: {
        building: {
          include: {
            dormitory: true
          }
        },
        status: true
      }
    });
    
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST create multiple rooms
// สร้างห้องหลายห้องพร้อมกัน (สำหรับตึกใหม่)
export const createMultipleRooms = async (req, res) => {
  try {
    const { buildingId, rooms } = req.body;
    // rooms = [{ price: 5000, statusId: 1 }, { price: 5500, statusId: 1 }, ...]
    
    if (!buildingId || !rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({ 
        error: 'Building ID and array of rooms are required' 
      });
    }
    
    // ตรวจสอบว่าอาคารมีอยู่จริง
    const building = await prisma.building.findUnique({
      where: { BuildingID: parseInt(buildingId) }
    });
    
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    // สร้างห้องหลายห้องพร้อมกัน
    const createdRooms = await prisma.room.createMany({
      data: rooms.map(room => ({
        price: parseFloat(room.price),
        statusId: parseInt(room.statusId),
        buildingId: parseInt(buildingId)
      }))
    });
    
    res.status(201).json({
      message: `Successfully created ${createdRooms.count} rooms`,
      count: createdRooms.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT update room
// อัพเดทข้อมูลห้อง
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, statusId, buildingId } = req.body;
    
    // ถ้ามีการเปลี่ยนสถานะ ตรวจสอบว่าเป็น ROOM status
    if (statusId) {
      const status = await prisma.status.findFirst({
        where: { 
          StatusID: parseInt(statusId),
          Type: 'ROOM'
        }
      });
      
      if (!status) {
        return res.status(404).json({ error: 'Room status not found' });
      }
    }
    
    const room = await prisma.room.update({
      where: { RoomID: parseInt(id) },
      data: {
        ...(price && { price: parseFloat(price) }),
        ...(statusId && { statusId: parseInt(statusId) }),
        ...(buildingId && { buildingId: parseInt(buildingId) })
      },
      include: {
        building: {
          include: {
            dormitory: true
          }
        },
        status: true
      }
    });
    
    res.json(room);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// PUT update room status
// อัพเดทเฉพาะสถานะห้อง (ใช้บ่อย เช่น เปลี่ยนจากว่างเป็นมีผู้เช่า)
export const updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;
    
    if (!statusId) {
      return res.status(400).json({ error: 'Status ID is required' });
    }
    
    // ตรวจสอบว่าเป็น ROOM status
    const status = await prisma.status.findFirst({
      where: { 
        StatusID: parseInt(statusId),
        Type: 'ROOM'
      }
    });
    
    if (!status) {
      return res.status(404).json({ error: 'Room status not found' });
    }
    
    const room = await prisma.room.update({
      where: { RoomID: parseInt(id) },
      data: {
        statusId: parseInt(statusId)
      },
      include: {
        status: true,
        building: {
          include: {
            dormitory: true
          }
        }
      }
    });
    
    res.json(room);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// DELETE room
// ลบห้อง (ต้องไม่มีสัญญาหรือใบแจ้งหนี้เชื่อมอยู่)
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.room.delete({
      where: { RoomID: parseInt(id) }
    });
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Cannot delete room with existing contracts or invoices' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};