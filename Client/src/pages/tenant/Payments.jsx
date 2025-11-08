import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentPopup from "../../components/PaymentPopup";
import arrowSort from "../../assets/arrow-sort.png";
import { getInvoicesByAuthId } from "../../api/invoice";

export default function Payments() {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await getInvoicesByAuthId();
        console.log(data);
        
        data.forEach((inv, index) => {
          console.log(`Invoice ${index + 1}:`, {
            InvoiceID: inv.InvoiceID,
            total: inv.total,
            statusName: inv.status?.name
          });
        });
      
        setBills(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // ✅ ฟังก์ชันกำหนดสถานะและสี
  const getStatusConfig = (statusName) => {
    switch (statusName) {
      case "Paid":
        return {
          text: "ชำระแล้ว",
          bgColor: "bg-[#97D76C]",
          isPaid: true
        };
      case "Success":
        return {
          text: "รอการตรวจสอบ",
          bgColor: "bg-gray-400",
          isPaid: false
        };
      case "Pending":
        return {
          text: "ค้างชำระ",
          bgColor: "bg-[#F15F5B]",
          isPaid: false
        };
      default:
        return {
          text: "ไม่ทราบสถานะ",
          bgColor: "bg-gray-300",
          isPaid: false
        };
    }
  };

  const formatAmount = (n) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 0 });

  const handleDownload = (bill) => {
    alert(`ดาวน์โหลดใบแจ้งหนี้: ${bill.InvoiceID}`);
  };

  const handlePay = (bill) => {
    setSelectedBill(bill);
    setShowPopup(true);
  };

  const handleDetail = (bill) => {
    navigate(`/tenant/payments?detail=${bill.InvoiceID}`);
  };

  const handlePaymentSuccess = (invoiceId, paidAt) => {
    setBills((prevBills) =>
      prevBills.map((b) =>
        b.InvoiceID === invoiceId
          ? { 
              ...b, 
              status: { ...b.status, name: "Success" }, 
              paidAt: paidAt || new Date().toISOString() 
            }
          : b
      )
    );
  };

  if (loading) return <div>Loading invoices...</div>;
  if (bills.length === 0) return <div>ยังไม่มีใบแจ้งหนี้</div>;

  return (
    <div className="w-full h-full">
      <div className="px-2 py-0">
        <div className="bg-white rounded-2xl p-4 md:p-6 overflow-x-auto">
          <div className="min-w-[950px]">
            <div className="grid grid-cols-12 items-center bg-[#645278] text-white rounded-xl px-4 py-4 text-sm md:text-base">
              <div className="col-span-1 flex items-center justify-center gap-1">
                ห้อง
                <img
                  src={arrowSort}
                  alt="sort"
                  className="w-5 h-5 p-[2px] rounded-md transition-colors duration-200 hover:bg-[#8D77A4] cursor-pointer"
                />
              </div>
              <div className="col-span-2 text-center">วันที่แจ้ง</div>
              <div className="col-span-2 text-center">กำหนดชำระ</div>
              <div className="col-span-2 text-center">วันที่ชำระ</div>
              <div className="col-span-2 text-center">จำนวนเงิน</div>
              <div className="col-span-3 text-center pr-[87px]">สถานะ</div>
            </div>

            <div className="mt-3 space-y-3">
              {bills.map((b) => {
                // ✅ ดึงข้อมูลสถานะจาก status.name
                const statusConfig = getStatusConfig(b.status?.name);
                const { text: statusText, bgColor: statusBgColor, isPaid } = statusConfig;
                
                return (
                  <div
                    key={b.InvoiceID}
                    className="grid grid-cols-12 items-center bg-[#E7DDF1] rounded-xl px-4 py-2"
                  >
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center justify-center bg-white rounded-xl px-3 py-1 text-[#3A3A3A] font-medium">
                        {b.room?.RoomName || "-"}
                      </span>
                    </div>

                    <div className="col-span-2 text-center text-[#3A3A3A]">
                      {b.Date ? new Date(b.Date).toLocaleDateString('th-TH') : "-"}
                    </div>

                    <div className="col-span-2 text-center text-[#3A3A3A]">
                      {b.Date
                        ? new Date(
                            new Date(b.Date).getFullYear(),
                            new Date(b.Date).getMonth(),
                            25
                          ).toLocaleDateString('th-TH')
                        : "-"}
                    </div>

                    <div className="col-span-2 text-center text-[#3A3A3A]">
                      {b.paidAt 
                        ? new Date(b.paidAt).toLocaleDateString('th-TH')
                        : b.receipts?.[0]?.date
                        ? new Date(b.receipts[0].date).toLocaleDateString('th-TH')
                        : "-"}
                    </div>

                    <div className="col-span-2 text-center font-medium">
                      {formatAmount(b.total)} บาท
                    </div>

                    {/* สถานะ + ปุ่ม */}
                    <div className="col-span-3 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownload(b)}
                        className="p-2 rounded-lg hover:bg-[#DCCBE9] active:scale-95 transition"
                        title="ดาวน์โหลด"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path d="M12 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 111.414 1.414l-4.007 4.007a1.25 1.25 0 01-1.414 0L7.279 12.707a1 1 0 111.414-1.414L11 13.586V4a1 1 0 011-1z" />
                          <path d="M5 20a1 1 0 100 2h14a1 1 0 100-2H5z" />
                        </svg>
                      </button>

                      {/* ✅ แสดงสถานะตาม status.name */}
                      <span
                        className={`flex items-center justify-center w-[120px] h-[34px] rounded-full text-sm font-medium text-black ${statusBgColor}`}
                      >
                        {statusText}
                      </span>

                      {/* ✅ แสดงปุ่มตามสถานะ */}
                      {isPaid ? (
                        <button
                          onClick={() => handleDetail(b)}
                          className="w-[150px] h-[34px] rounded-full text-sm font-medium bg-[#FEB863] text-black hover:bg-[#FEA130] active:scale-95 transition"
                        >
                          ดูรายละเอียด
                        </button>
                      ) : b.status?.name === "Success" ? (
                        <button
                          onClick={() => handleDetail(b)}
                          className="w-[150px] h-[34px] rounded-full text-sm font-medium bg-[#FEB863] text-black hover:bg-[#FEA130] active:scale-95 transition"
                        >
                          ดูรายละเอียด
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePay(b)}
                          className="w-[150px] h-[34px] rounded-full text-sm font-medium bg-[#FEB863] text-black hover:bg-[#FEA130] active:scale-95 transition"
                        >
                          ชำระเงิน
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showPopup && selectedBill && 
      <PaymentPopup 
        onClose={() => setShowPopup(false)} 
        onSuccess={handlePaymentSuccess}  
        amount={selectedBill.total}
        invoiceId={selectedBill.InvoiceID}
      />}
    </div>
  );
}