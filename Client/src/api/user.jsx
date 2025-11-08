import axios from "axios";
import apiClient from "./axios";

const AUTH_API_URL = "http://localhost:3000/api/auth";
const USER_API_URL = "http://localhost:3000/api/users";

export const getMyProfile = async () => {
  try {
    const res = await axios.get(`${AUTH_API_URL}/me`);
    const user = res.data.user;

    if (user?.authId) {
      localStorage.setItem("authId", user.authId); //เก็บ authId
    }

    return user;
  } catch (error) {
    console.error("Error fetching my profile:", error);
    throw error;
  }
};

export const getTenantByAuthId = async () => {
  try {
    const res = await axios.get(`${USER_API_URL}/e4f77a4e-0655-40b0-8881-27a87da54824`);
    return res.data;
  } catch (error) {
    console.error("Error fetching tenant by authId:", error);
    throw error;
  }
};

export const getAdminByAuthId = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/api/ea21ad0f-1490-4b0d-9c30-3a0ef81e4321`);
    return res.data;
  } catch (error) {
    console.error("Error fetching admin by authId:", error);
    throw error;
  }
};

