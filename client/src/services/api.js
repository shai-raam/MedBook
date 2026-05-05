import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Doctors
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getSlots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  getSpecializations: () => api.get('/doctors/specializations'),
  getBySpecialization: (spec, date) => api.get(`/doctors/specialization/${spec}`, { params: { date } }),
  updateProfile: (data) => api.put('/doctors/profile', data),
};

// Appointments
export const appointmentAPI = {
  create: (data) => api.post('/appointments', data),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  cancel: (id, data) => api.put(`/appointments/${id}/cancel`, data),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  getQueue: (doctorId, date) => api.get(`/appointments/queue/${doctorId}/${date}`),
};

// Payments
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
  refund: (id) => api.post(`/payments/${id}/refund`),
};

// Prescriptions
export const prescriptionAPI = {
  create: (data) => api.post('/prescriptions', data),
  getMyPrescriptions: () => api.get('/prescriptions/my'),
  getByPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  getById: (id) => api.get(`/prescriptions/${id}`),
};

// Availability
export const availabilityAPI = {
  get: () => api.get('/availability'),
  set: (data) => api.post('/availability', data),
  delete: (id) => api.delete(`/availability/${id}`),
};

// Triage
export const triageAPI = {
  getSymptoms: () => api.get('/triage/symptoms'),
  analyze: (symptoms) => api.post('/triage/analyze', { symptoms }),
};

// Admin
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getAnalytics: () => api.get('/admin/analytics'),
  getEmergency: () => api.get('/admin/emergency'),
  approveEmergency: (id) => api.put(`/admin/emergency/${id}/approve`),
};

export default api;
