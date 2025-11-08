import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import iconLogo from '../../assets/icon-do.svg';
import graphCircle from '../../assets/graph-do1.svg';
import graph from '../../assets/graph-do2.svg';
import buttonSearch from '../../assets/button-search.svg';
import arrowSort from '../../assets/arrow-sort.png';
import { getAllRooms } from "../../api/room";
import { getAdminByAuthId } from '../../api/user';

export default function DashboardOwner() {
  const [rooms, setRooms] = useState([]); // ✅ state สำหรับเก็บข้อมูลจาก DB
  const [admin, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const profileData = await getAdminByAuthId();
        setUser(profileData);

        const roomData = await getAllRooms();
        setRooms(roomData);
        
      } catch (error) {
        console.error("Error fetching room data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* text */}
      <span className="text-4xl font-bold mt-8 block ml-12 mr-12">สวัสดี คุณ {admin?.FName || "เจ้าของหอพัก"} </span>
      <div className="text-sm md:text-lg mt-[-4px] ml-12 mr-12">คุณสามารถติดตามค่าใช้จ่าย สร้างใบแจ้งค่าห้อง และเข้าถึงข้อมูลสำคัญได้ง่าย ๆ หวังว่าการใช้งาน ROOMIN จะช่วยให้ชีวิตในการจัดการหอพักของคุณราบรื่นขึ้น</div>

      {/* กรอบครอบทั้งหมด */}
      <div className="rounded-xl border p-4 bg-[#FFFDFB]">

        {/* ส่วนที่ครอบ */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">

          {/* สถานะห้อง */}
          <section className="bg-[#FFFDFB] lg:w-1/5 ">
            <div className="rounded-xl p-2 bg-[#FFFDFB]">
              <div className="font-semibold">สถานะห้อง</div>
              <div className="text-sm">ทั้งหมด {rooms.length} ห้อง</div>
              <div className="flex items-center justify-center mt-4">
                <img src={graphCircle} alt="graphcircle" className="w-36 h-36 mr-2" />
              </div>

              {/* list ทั้งหมด */}
              <div className="flex flex-wrap items-center gap-2 m-4 mb-0">
                <div className="flex items-center text-[#FEB863]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="12" />
                  </svg>
                  <span className="text-sm text-black">เช่าแล้ว</span>
                </div>

                <div className="flex items-center text-[#C76E01]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="12" />
                  </svg>
                  <span className="text-sm text-black">จองแล้ว</span>
                </div>

                <div className="flex items-center text-[#FEA130]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="12" />
                  </svg>
                  <span className="text-sm text-black">ว่าง</span>
                </div>
              </div>
            </div>
          </section>

          {/* แถบสรุปตัวเลข */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 flex-1">
            <div className="rounded-xl p-5 bg-[#FFE6C8]">
              <div className="flex items-center justify-between mb-4">
                <img src={iconLogo} alt="logo" className="w-12 h-12 mr-2" />
                <span className="text-4xl font-bold text-[#000000]">70,000</span>
              </div>
              <div className="font-semibold">รายรับ</div>
              <div className="text-sm">ประจำเดือน: {new Date().toLocaleString("th-TH", { month: "long" })}</div>
            </div>
            <div className="rounded-xl p-5 bg-[#FFE6C8]">
              <div className="flex items-center justify-between mb-4">
                <img src={iconLogo} alt="logo" className="w-12 h-12 mr-2" />
                <span className="text-4xl font-bold text-[#000000]">40,000</span>
              </div>
              <div className="font-semibold">รายจ่าย</div>
              <div className="text-sm">ประจำเดือน: {new Date().toLocaleString("th-TH", { month: "long" })}</div>
            </div>
            <div className="rounded-xl p-5 bg-[#FFE6C8]">
              <div className="flex items-center justify-between mb-4">
                <img src={iconLogo} alt="logo" className="w-12 h-12 mr-2" />
                <span className="text-4xl font-bold text-[#000000]">{rooms.filter((r) => r.statusId === 2).length}</span>
              </div>
              <div className="font-semibold">จำนวนผู้พักอาศัย</div>
              <div className="text-sm">ประจำเดือน:  {new Date().toLocaleString("th-TH", { month: "long" })}</div>
            </div>
            <div className="rounded-xl p-5 bg-[#FFE6C8]">
              <div className="flex items-center justify-between mb-4">
                <img src={iconLogo} alt="logo" className="w-12 h-12 mr-2" />
                <span className="text-4xl font-bold text-[#000000]">{rooms.filter((r) => r.statusId === 3).length}</span>
              </div>
              <div className="font-semibold">จำนวนห้องค้างชำระ</div>
              <div className="text-sm">อัพเดทล่าสุด 10 นาทีที่แล้ว</div>
            </div>
          </section>
          
          {/* กราฟ */}
          <div className="bg-[#E4E0E9] rounded-xl flex items-center justify-center">
            <div className="flex justify-center items-center bg-white rounded-xl">
              <img src={graph} alt="graph" className="w-full h-full object-contain" />
            </div>
          </div>

        </div>
      </div>

      {/* กรอบครอบทั้งหมดของช่องค้นหา */}
      <div className="rounded-[30px] bg-[#E4E0E9] p-[6px] w-full max-w-md ml-auto">

        {/* กล่องช่องค้นหา + ปุ่มค้นหา */}
        <div className="flex items-center gap-2 ml-2 mr-2">
          {/* ช่องค้นหา */}
          <div className="flex items-center w-full h-[40px] rounded-[18px] bg-[#FFFDFB] px-4">
            <input
              type="text"
              placeholder="ค้นหา..."
              className="w-full outline-none border-none font-medium font-[Playfair_Display] placeholder:text-black/50"
            />
          </div>

          {/* ปุ่มค้นหา */}
          <button className="flex items-center justify-center w-[48px] h-[48px] transition">
            <img
              src={buttonSearch}
              alt="buttonsearch"
              className="w-10 h-10 object-contain"
            />
          </button>
        </div>
      </div>

      {/* กรอบรวมทั้งหมด (มี scroll ทั้งแนวตั้งและแนวนอน) */}
      <div className="w-full max-w-[95vw] overflow-x-auto overflow-y-auto h-[400px] rounded-xl">
        {/* หัวตาราง */}
        <div className="grid w-full grid-cols-[70px_1.8fr_80px_180px_180px_140px_140px]
                    items-center gap-4 bg-[#7D6796] text-white rounded-xl px-5 py-4">
          <span className="flex items-center justify-center gap-1">
            ห้อง
            <img
              src={arrowSort}
              alt="sort"
              className="w-5 h-5 p-[2px] rounded-md transition-colors duration-200 hover:bg-[#8D77A4] cursor-pointer"
            />
          </span>
          <span className="text-center">ผู้เช่า</span>
          <span className="text-center">จำนวน</span>
          <span className="text-center">สถานะห้อง</span>
          <span className="text-center">สถานะผู้เช่า</span>
          <span className="text-center">เริ่มสัญญา</span>
          <span className="text-center">หมดสัญญา</span>
        </div>

          {rooms
            .sort((a, b) => parseInt(a.RoomName) - parseInt(b.RoomName))
            .map((r) => {
              const tenants = r.contracts?.map(c => c.user) || [];
              const count = tenants.length;
            return (
              <div
                key={r.RoomID}
                className="border rounded-xl px-5 py-3 bg-[#FFFDFB] flex items-center justify-between text-sm"
              >
                <div className="grid w-full grid-cols-[70px_1.8fr_80px_180px_180px_140px_140px] items-center gap-4">
                  <span className="text-center">{r.RoomName}</span>

                {/* ผู้เช่า */}
                <div className="text-gray-800 flex flex-col min-w-0 items-center text-center">
                  {tenants.length > 0 ? tenants.map((t, i) => (
                    <span key={i} className="truncate">{t.FName} {t.LName}</span>
                  )) : (
                    <span className="text-gray-400 italic">ยังไม่มีข้อมูล</span>
                  )}
                </div>

                  <span className="text-center">{count}</span>

                  {/* สถานะห้อง */}
                  <span className={`h-8 inline-flex justify-center items-center rounded-full px-3 text-sm
                    ${r.statusId === 2 ? "bg-[#FEB863]" : "bg-gray-200"}`}>
                    {r.statusId === 2  ? "เช่าแล้ว" : "ว่าง"}
                  </span>
                  {/* สถานะผู้เช่า */}
                  <span className={`h-8 inline-flex justify-center items-center rounded-full px-3 text-sm
                    ${tenants.some(t => t.status === "ค้างชำระ") ? "bg-[#F15F5B]" : tenants.length > 0 ? "bg-[#97D76C]" : "#FFFDFB"}`}>
                    {tenants.some(t => t.status === "ค้างชำระ") ? "ค้างชำระ" : tenants.length > 0 ? "ชำระแล้ว" : "-"}
                  </span>

                  {/* วันเริ่ม / สิ้นสุดสัญญา */}
                  <span className="text-center text-gray-700">
                    {r.contracts?.[0]?.DayStart
                      ? new Date(r.contracts[0].DayStart).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })
                      : "-"}
                  </span>

                  <span className="text-center text-gray-700">
                    {r.contracts?.[0]?.DayEnd
                      ? new Date(r.contracts[0].DayEnd).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })
                      : "-"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );
}
