import api from './api';

export const registerStudent = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginStudent = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
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
