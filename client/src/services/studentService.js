import api from './api';

export const getMyProfile = async () => {
  const response = await api.get('/students/me');
  return response.data;
};

export const updateMyProfile = async (profileData) => {
  const response = await api.put('/students/me', profileData);
  return response.data;
};

export const uploadAvatarImage = async (formData) => {
  const response = await api.post('/students/me/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateMyAvatar = async (avatar) => {
  const response = await api.put('/students/me/avatar', { avatar });
  return response.data;
};

export const fetchAllSkills = async () => {
  const response = await api.get('/skills');
  return response.data;
};

export const addStudentSkill = async (skillName, category = 'Technical') => {
  const response = await api.post('/students/me/skills', { skillName, category });
  return response.data;
};

export const removeStudentSkill = async (skillId) => {
  const response = await api.delete(`/students/me/skills/${skillId}`);
  return response.data;
};

export const getStudentActivities = async () => {
  const response = await api.get('/students/me/activities');
  return response.data;
};

export const getDashboardOverview = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getPlatformStatistics = async () => {
  const response = await api.get('/statistics');
  return response.data;
};

