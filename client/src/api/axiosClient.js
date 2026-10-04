import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 20000,
});

// Surface the backend's { success, message } error shape consistently so
// components can just read err.message.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  },
);

export { API_URL };
export default apiClient;
