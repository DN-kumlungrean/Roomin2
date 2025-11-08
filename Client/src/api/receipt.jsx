import axios from 'axios';

const RECEIPT_API_URL = "http://localhost:3000/api/receipts";

/**
 * 🚀 อัปโหลดไฟล์สลิปและสร้างใบเสร็จใหม่
 * @param {FormData} formData - ข้อมูลฟอร์มที่มีไฟล์สลิป (key: 'file') และ metadata (invoiceId, amount, date)
 * @returns {Promise} response.data
 */
export const uploadPaymentSlip = async (formData) => {
    try {
        const response = await axios.post(RECEIPT_API_URL, formData);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error("Server Error Response:", error.response.data);
            throw error.response.data;
        } else {
            console.error("Network/Other Error:", error.message);
            throw { error: error.message };
        }
    }
};