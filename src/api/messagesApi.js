import axiosInstance from './axios';

const messagesApi = {
    sendMessages: (data) => axiosInstance.post('/messages/send', data),
    history: (params) => axiosInstance.get('/messages/history', { params }),
    refreshStatus: (id) => axiosInstance.post(`/messages/${id}/refresh`),
};

export default messagesApi;
