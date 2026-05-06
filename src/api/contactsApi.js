import axiosInstance from './axios';

const contactsApi = {
  getContacts: (params) => axiosInstance.get('/contacts', { params }),
  getContact: (id) => axiosInstance.get(`/contacts/${id}`),
  createContact: (data) => axiosInstance.post('/contacts', data),
  updateContact: (id, data) => axiosInstance.put(`/contacts/${id}`, data),
  deleteContact: (id) => axiosInstance.delete(`/contacts/${id}`),
  toggleStatus: (id) => axiosInstance.patch(`/contacts/${id}/toggle`),
  getTemplate: () => axiosInstance.get('/contacts/template', { responseType: 'blob' }),
  importContacts: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/contacts/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
};

export default contactsApi;
