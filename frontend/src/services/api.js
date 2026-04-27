import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getCurrentUser = () => api.get('/auth/me');
export const getUsers = () => api.get('/auth/users');
export const registerUser = (data) => api.post('/auth/users', data);
export const createUser = (data) => api.post('/auth/users', data);
export const updateUserStatus = (id, data) => api.put(`/auth/users/${id}/status`, data);
export const authMiddleware = () => Promise.resolve(true);

// Dashboard
export const getSummary = () => api.get('/dashboard/summary');
export const getUpcomingReminders = () => api.get('/reminders/upcoming');

// Clients
export const getClients = (search = '') => api.get(`/clients?search=${search}`);
export const getClient = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Products
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Orders / Deliveries
export const getOrders = (clientId = '') => api.get(`/orders?client_id=${clientId}`);
export const getOrder = (id) => api.get(`/orders/${id}`);
export const getClientOrders = (clientId) => api.get(`/orders/client/${clientId}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Reminders
export const getReminders = (clientId = '', status = '') => api.get(`/reminders?client_id=${clientId}&status=${status}`);
export const getReminder = (id) => api.get(`/reminders/${id}`);
export const createReminder = (data) => api.post('/reminders', data);
export const updateReminder = (id, data) => api.put(`/reminders/${id}`, data);
export const completeReminder = (id) => api.put(`/reminders/${id}/complete`);
export const deleteReminder = (id) => api.delete(`/reminders/${id}`);
export const testSendReminder = (id) => api.post(`/reminders/test-send/${id}`);

// Bills
export const getBills = (search = '', status = '') => api.get(`/bills?search=${search}&status=${status}`);
export const getBillsFromOrders = (clientId = '', status = '') => api.get(`/orders?client_id=${clientId}&status=${status}`);
export const createBill = (data) => api.post('/bills', data);
export const updateBill = (id, data) => api.put(`/bills/${id}`, data);
export const deleteBill = (id) => api.delete(`/bills/${id}`);

export default api;