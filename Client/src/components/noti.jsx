import React, { useEffect, useState } from 'react';

/**
 * Component แจ้งเตือนแบบ Toast (เลื่อนเข้า/ออก)
 * @param {object} props
 * @param {string} props.message - ข้อความที่จะแสดงใน Notification
 * @param {function} props.onClose - ฟังก์ชันที่ถูกเรียกเมื่อ Notification หายไป
 */
export default function DownloadNotification({ message, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. ทำให้ Notification ปรากฏ (เลื่อนเข้า) ทันทีที่ Component ถูก Mount
    setIsVisible(true);

    // 2. ตั้งเวลาให้ Notification เริ่มหายไป (เลื่อนออก) หลัง 3 วินาที
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    // 3. ตั้งเวลาให้เรียก onClose หลัง Animation เลื่อนออกเสร็จสิ้น (รวม 300ms)
    const removalTimer = setTimeout(() => {
      onClose();
    }, 3300); // 3000ms (แสดง) + 300ms (Animation ออก)

    // Cleanup: ล้าง Timer เมื่อ Component ถูก Unmount
    return () => {
      clearTimeout(timer);
      clearTimeout(removalTimer);
    };
  }, [onClose]);

  return (
    <div
      // Class สำหรับตำแหน่งและ Z-index สูง
      className={`fixed top-4 right-4 z-[60] p-4 pr-10 
                  bg-white border-l-4 border-green-500 text-gray-800 rounded-lg shadow-xl 
                  flex items-center transition-transform duration-300 ease-out
                  ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
}