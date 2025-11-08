import React, { useEffect, useState } from "react";

export default function InvoiceDetailPopup({ invoice, onClose }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (invoice) {
      setDetails(invoice);
    }
  }, [invoice]);

  const formatAmount = (n) =>
    n?.toLocaleString("th-TH", { minimumFractionDigits: 2 }) || "0.00";

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusConfig = (statusName) => {
    switch (statusName) {
      case "Paid":
        return { text: "ชำระแล้ว", bgColor: "bg-[#97D76C]" };
      case "Success":
        return { text: "รอการตรวจสอบ", bgColor: "bg-gray-400" };
      case "Pending":
        return { text: "ค้างชำระ", bgColor: "bg-[#F15F5B]" };
      default:
        return { text: "ไม่ทราบสถานะ", bgColor: "bg-gray-300" };
    }
  };

  if (!details) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fadeIn">
          <p className="text-center text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(details.status?.name);
  
  // คำนวณยอดรวม
  const totalAmount = details.itemlists?.reduce(
    (sum, item) => sum + (item.quantity * item.item?.price || 0),
    0
  ) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[70vh] overflow-hidden shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#645278] to-[#8D77A4] text-white px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">รายละเอียดใบแจ้งหนี้</h2>
              <p className="text-white/80 text-sm mt-1">Invoice #{details.InvoiceID}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(70vh-120px)]">
          {/* ข้อมูลทั่วไป */}
          <div className="bg-gradient-to-br from-[#F5F1F8] to-[#E7DDF1] rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#645278]">ข้อมูลใบแจ้งหนี้</h3>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold text-black shadow-md ${statusConfig.bgColor}`}>
                {statusConfig.text}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">ห้อง</p>
                <p className="font-bold text-lg text-[#645278]">{details.room?.RoomName || "-"}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">วันที่แจ้ง</p>
                <p className="font-semibold text-[#645278]">{formatDate(details.Date)}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">กำหนดชำระ</p>
                <p className="font-semibold text-[#645278]">
                  {details.Date
                    ? new Date(
                        new Date(details.Date).getFullYear(),
                        new Date(details.Date).getMonth(),
                        25
                      ).toLocaleDateString("th-TH")
                    : "-"}
                </p>
              </div>
              {details.receipts?.[0]?.date && (
                <div className="bg-white/60 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">วันที่ชำระ</p>
                  <p className="font-semibold text-[#645278]">{formatDate(details.receipts[0].date)}</p>
                </div>
              )}
            </div>
          </div>

          {/* รายการค่าใช้จ่าย */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#645278] mb-4">รายการค่าใช้จ่าย</h3>
            <div className="bg-white border-2 border-[#E7DDF1] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#E7DDF1] to-[#F5F1F8]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-[#645278]">รายการ</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-[#645278]">จำนวน</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-[#645278]">ราคา/หน่วย</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-[#645278]">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DDF1]">
                  {details.itemlists?.map((itemlist, index) => {
                    const itemTotal = itemlist.quantity * (itemlist.item?.price || 0);
                    return (
                      <tr key={index} className="hover:bg-[#F5F1F8] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{itemlist.item?.name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-center">{itemlist.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatAmount(itemlist.item?.price)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-[#645278]">{formatAmount(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gradient-to-r from-[#645278] to-[#8D77A4]">
                  <tr>
                    <td colSpan="3" className="px-4 py-4 text-right font-bold text-white text-base">
                      ยอดรวมทั้งหมด
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-xl text-white">
                      {formatAmount(totalAmount)} ฿
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ข้อมูลการชำระเงิน */}
          {details.receipts && details.receipts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#645278] mb-4">ข้อมูลการชำระเงิน</h3>
              <div className="bg-gradient-to-br from-[#F5F1F8] to-[#E7DDF1] rounded-2xl p-6">
                {details.receipts.map((receipt, index) => (
                  <div key={index} className="bg-white rounded-xl p-5 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">วันที่ชำระ</span>
                        <p className="font-semibold text-[#645278] mt-1">{formatDate(receipt.date)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">จำนวนเงิน</span>
                        <p className="font-bold text-xl text-[#645278] mt-1">{formatAmount(receipt.amount)} ฿</p>
                      </div>
                    </div>
                    {receipt.proof && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">หลักฐานการชำระเงิน</p>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <img
                            src={receipt.proof}
                            alt="Payment slip"
                            className="w-full max-w-sm mx-auto rounded-lg border-2 border-[#E7DDF1] shadow-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ปุ่มปิด */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-[#645278] to-[#8D77A4] text-white px-10 py-3 rounded-full font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}