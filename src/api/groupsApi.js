import axiosInstance from './axios';

const groupsApi = {
  // Groups CRUD
  getGroups: (params) => axiosInstance.get('/contact-groups', { params }),
  createGroup: (data) => axiosInstance.post('/contact-groups', data),
  updateGroup: (id, data) => axiosInstance.put(`/contact-groups/${id}`, data),
  deleteGroup: (id) => axiosInstance.delete(`/contact-groups/${id}`),
  toggleGroup: (id) => axiosInstance.patch(`/contact-groups/${id}/toggle`),

  // Group members
  getMembers: (groupId, params) => axiosInstance.get(`/contact-groups/${groupId}/members`, { params }),
  addMembers: (groupId, contactIds) => axiosInstance.post(`/contact-groups/${groupId}/members`, { contact_ids: contactIds }),
  removeMembers: (groupId, contactIds) => axiosInstance.delete(`/contact-groups/${groupId}/members`, { data: { contact_ids: contactIds } }),
  getAvailableContacts: (groupId, search) => axiosInstance.get(`/contact-groups/${groupId}/available-contacts`, { params: { search } }),
};

export default groupsApi;
