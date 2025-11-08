// ในไฟล์ API Client ของคุณ (เช่น api/receipt.js หรือ api/invoice.js)

import axios from 'axios';

// 🛑 เปลี่ยน API_URL ให้ชี้ไปที่ Express Route ที่จัดการใบเสร็จ
// สมมติว่า Express Server รันอยู่ที่ PORT_EXPRESS และใช้ Route /receipts
// **คุณต้องเปลี่ยน 'http://localhost:PORT_EXPRESS' ให้ตรงกับ Express Server ของคุณ**
const RECEIPT_API_URL = "http://localhost:3000/api/receipts";

/**
 * 🚀 อัปโหลดไฟล์สลิปและสร้างใบเสร็จใหม่
 * @param {FormData} formData - ข้อมูลฟอร์มที่มีไฟล์สลิป (key: 'file') และ metadata (invoiceId, amount, date)
 * @returns {Promise} response.data
 */
export const uploadPaymentSlip = async (formData) => {
    try {
        // Axios จะตรวจจับ FormData และตั้งค่า Content-Type: multipart/form-data ให้อัตโนมัติ
        const response = await axios.post(RECEIPT_API_URL, formData);
        
        return response.data; // ส่งกลับข้อมูลจาก backend
        
    } catch (error) {
        // จัดการ error ที่มาจาก Server (4xx, 5xx) หรือ Network error
        if (error.response) {
            // Server ตอบกลับด้วย error status code
            console.error("Server Error Response:", error.response.data);
            throw error.response.data; // ส่งข้อมูล error จาก server กลับไป
        } else {
            // Network error (Server ปิด, Connection timeout, DNS error)
            console.error("Network/Other Error:", error.message);
            throw { error: error.message };
        }
    }
};