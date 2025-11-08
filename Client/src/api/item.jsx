import axios from 'axios'
const API_URL = "http://localhost:3000/api/items";

//ดึง invoices ของผู้ใช้
export const getInvoicesByAuthId = async (authId) => {
  const res = await axios.get(`${API_URL}/user/e4f77a4e-0655-40b0-8881-27a87da54824`);
  return res.data;
};

export const createItem = async (itemData) => {
  try {
    const response = await axios.post(API_URL, itemData, {
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

export const getItems = async (item) => {
  const res = await axios.get(`${API_URL}`);
  return res.data;
};