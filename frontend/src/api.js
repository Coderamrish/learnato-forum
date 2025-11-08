import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API call
export const auth = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Posts API calls
export const posts = {
  getAll: async () => {
    const response = await api.get('/posts');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },
  create: async (postData) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },
  update: async (id, postData) => {
    const response = await api.put(`/posts/${id}`, postData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  }
};