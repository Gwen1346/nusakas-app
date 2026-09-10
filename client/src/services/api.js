import axios from 'axios';

// Otomatis mendeteksi apakah berjalan di Vercel (production) atau lokal
const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api/v1'
  : '/api/v1'; // Menggunakan relative path agar otomatis ikut domain Vercel yang aktif

const api = axios.create({
  baseURL,
});

// Otomatis sisipkan token di setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;