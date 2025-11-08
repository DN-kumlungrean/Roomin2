import axios from "axios";

// สร้าง instance ของ axios
const apiClient = axios.create({
  baseURL: "http://localhost:3000/api", 
  withCredentials: true, 
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, config } = error;
    const status = error.response ? error.response.status : null;
    if (status === 401) {
      const isPublicCheck = config.url.endsWith('/auth/me');
      const isNotOnLoginPage = window.location.pathname.startsWith('/login') === false;
      if (!isPublicCheck && isNotOnLoginPage) {
        console.error("UNAUTHORIZED (401) on a private route. Redirecting to /login/tenant...");
        window.location.href = "/login/tenant";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;