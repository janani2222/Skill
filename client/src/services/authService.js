import api from './api';

export const registerStudent = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginStudent = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const loginAdmin = async (credentials) => {
  const response = await api.post('/auth/admin-login', credentials);
  return response.data;
};

export const logoutStudent = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getSettings = async () => (await api.get('/settings')).data;
export const updateSettings = async (settings) => (await api.put('/settings', settings)).data;
export const changePassword = async (payload) => (await api.put('/settings/password', payload)).data;

