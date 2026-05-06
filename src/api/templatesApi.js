import axiosInstance from './axios';

export const listTemplates = async (params = {}) => {
  const res = await axiosInstance.get('/templates', { params });
  return res.data;
};

export const listAdminTemplates = async (params = {}) => {
  const res = await axiosInstance.get('/admin/templates', { params });
  return res.data;
};

export const createTemplate = async (formData) => {
  const res = await axiosInstance.post('/admin/templates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const toggleTemplate = async (id) => {
  const res = await axiosInstance.patch(`/admin/templates/${id}/toggle`);
  return res.data;
};

export const updateTemplate = async (id, payload) => {
  const res = await axiosInstance.put(`/admin/templates/${id}`, payload);
  return res.data;
};

export const listTemplateCategories = async (params = {}) => {
  const res = await axiosInstance.get('/template-categories', { params });
  return res.data;
};

export const createTemplateCategory = async (payload) => {
  const res = await axiosInstance.post('/template-categories', payload);
  return res.data;
};

export const updateTemplateCategory = async (id, payload) => {
  const res = await axiosInstance.put(`/template-categories/${id}`, payload);
  return res.data;
};

export const deleteTemplateCategory = async (id) => {
  const res = await axiosInstance.delete(`/template-categories/${id}`);
  return res.data;
};

export const listTemplateNames = async (params = {}) => {
  const res = await axiosInstance.get('/template-names', { params });
  return res.data;
};

export const createTemplateName = async (payload) => {
  const res = await axiosInstance.post('/template-names', payload);
  return res.data;
};

export const updateTemplateName = async (id, payload) => {
  const res = await axiosInstance.put(`/template-names/${id}`, payload);
  return res.data;
};

export const deleteTemplateName = async (id) => {
  const res = await axiosInstance.delete(`/template-names/${id}`);
  return res.data;
};

export const fetchAsBlob = async (url) => {
  const res = await axiosInstance.get(url, { responseType: 'blob' });
  return res.data;
};
