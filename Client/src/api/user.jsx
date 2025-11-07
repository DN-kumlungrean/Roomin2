import axios from "axios";


export const getMyProfile = async () => {
  try {
    const res = await axios.get("http://localhost:3000/api/auth/me"); 
    return res.data.user; 
  
  } catch (error) {
    console.error("Error fetching my profile:", error);
    throw error; 
  }
};
