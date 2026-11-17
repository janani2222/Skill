import api from './api';

export const getAdminOverview = () => api.get('/admin/overview').then((res) => res.data);
export const getAdminStudents = (params = {}) => api.get('/admin/students', { params }).then((res) => res.data);
export const toggleStudentActive = (id, active) => api.patch(`/admin/students/${id}/active`, { active }).then((res) => res.data);
export const deleteStudent = (id) => api.delete(`/admin/students/${id}`).then((res) => res.data);

export const getAdminProjects = (params = {}) => api.get('/admin/projects', { params }).then((res) => res.data);
export const deleteAdminProject = (id) => api.delete(`/admin/projects/${id}`).then((res) => res.data);

export const getAdminWorkshops = () => api.get('/admin/workshops').then((res) => res.data);
export const createAdminWorkshop = (payload) => api.post('/admin/workshops', payload).then((res) => res.data);
export const updateAdminWorkshop = (id, payload) => api.put(`/admin/workshops/${id}`, payload).then((res) => res.data);
export const deleteAdminWorkshop = (id) => api.delete(`/admin/workshops/${id}`).then((res) => res.data);

export const getAdminCommunities = () => api.get('/admin/communities').then((res) => res.data);
export const createAdminCommunity = (payload) => api.post('/admin/communities', payload).then((res) => res.data);
export const deleteAdminCommunity = (id) => api.delete(`/admin/communities/${id}`).then((res) => res.data);

export const getAdminJoinRequests = () => api.get('/admin/join-requests').then((res) => res.data);

export const getAdminAnnouncements = () => api.get('/admin/announcements').then((res) => res.data);
export const createAdminAnnouncement = (payload) => api.post('/admin/announcements', payload).then((res) => res.data);
export const deleteAdminAnnouncement = (id) => api.delete(`/admin/announcements/${id}`).then((res) => res.data);

export const getAdminReports = () => api.get('/admin/reports').then((res) => res.data);
export const getAdminAuditLogs = () => api.get('/admin/audit-logs').then((res) => res.data);
export const changeAdminPassword = (payload) => api.put('/admin/password', payload).then((res) => res.data);

