// ===== SelectRoom Component (Main Page) =====
import React, { useState, useEffect } from "react";
import RoomCard from "/src/components/Roomcard.jsx"; 
import { useNavigate } from "react-router-dom";
import { getAllRooms } from "../../api/room";

export default function SelectRoom() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("ทั้งหมด");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");

  const months  = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  // ดึงข้อมูลห้องจาก backend
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getAllRooms();
        setRooms(data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    setSelectedMonth(months[currentMonth]);
  }, []);

  const currentMonth = months[new Date().getMonth()];

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const hasTenant = room.contracts && room.contracts.length > 0;
    if (statusFilter === "สร้างแล้ว") return hasTenant;
    if (statusFilter === "ยังไม่สร้าง") return !hasTenant;
    return true;
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const nameA = parseInt(a.roomName);
    const nameB = parseInt(b.roomName);
    return nameA - nameB;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D6796]"
          >
            <option>เลือกห้อง</option>
            <option>ทั้งหมด</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D6796]"
          >
            {months.map((month, index) => (
              <option key={index} value={month}>
                {month}
              </option>
            ))}
          </select>

          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7D6796]">
            ⇅
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm font-medium">สถานะใบแจ้งค่าห้อง</span>
          {["ทั้งหมด", "สร้างแล้ว", "ยังไม่สร้าง"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1 rounded-full text-sm transition ${
                statusFilter === status
                  ? status === "สร้างแล้ว"
                    ? "bg-green-500 text-white"
                    : status === "ยังไม่สร้าง"
                    ? "bg-red-500 text-white"
                    : "bg-[#7D6796] text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedRooms.map((room) => {
            const hasTenant = room.contracts.length > 0;
            const tenantName = hasTenant
              ? `${room.contracts[0].user.FName} ${room.contracts[0].user.LName}`
              : "ว่าง";

            return (
              <RoomCard
                key={room.RoomID}
                roomNumber={room.roomName || room.number}
                hasBill={hasTenant}
                tenant={tenantName}
                month={currentMonth}
                onClick={() =>
                  navigate("/owner/invoice", {
                    state: {
                      roomId: room.RoomID,
                      userId: room.contracts?.[0]?.user?.UserID || null, // ถ้ามีเจ้าของห้อง
                    },
                  })
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}