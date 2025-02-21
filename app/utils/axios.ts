/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */


import axios from 'axios';
import { useRouter } from 'next/navigation';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 