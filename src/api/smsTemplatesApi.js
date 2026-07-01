import axiosInstance from './axios';

const smsTemplatesApi = {
    getTemplates: () => axiosInstance.get('/sms-templates'),
    createTemplate: (data) => axiosInstance.post('/sms-templates', data),
    updateTemplate: (id, data) => axiosInstance.put(`/sms-templates/${id}`, data),
    deleteTemplate: (id) => axiosInstance.delete(`/sms-templates/${id}`),
};

export default smsTemplatesApi;
