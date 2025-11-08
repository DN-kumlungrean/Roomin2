import axios from 'axios'
const API_URL = "http://localhost:3000/api/invoices";

/**
 * สร้าง invoice ใหม่
 * @param {Object} invoiceData - ข้อมูล invoice
 * @returns {Promise} response.data
 */
export const createInvoice = async (invoiceData) => {
  try {
    const response = await axios.post(API_URL, invoiceData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { error: error.message };
    }
  }
};

// ดึง invoices ของผู้ใช้
export const getInvoicesByAuthId = async (authId) => {
  const res = await axios.get(`${API_URL}/user/e4f77a4e-0655-40b0-8881-27a87da54824`);
  return res.data;
};

export const getAllInvoices = async (invoice) => {
  const res = await axios.get(`${API_URL}`);
  return res.data;
};

// สร้าง QR จาก Omise ผ่าน backend
export const createQRPayment = async (invoiceId, amount) => {
  try {
    const res = await axios.post(`${API_URL}/payment`, { invoiceId, amount });
    return res.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { error: error.message };
    }
  }
};
