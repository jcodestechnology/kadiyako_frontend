import axiosInstance from './axios';

const eventsApi = {
    getEvents: (params) => {
        return axiosInstance.get('/events', { params });
    },

    getEvent: (id) => {
        return axiosInstance.get(`/events/${id}`);
    },

    createEvent: (data) => {
        return axiosInstance.post('/events', data);
    },

    updateEvent: (id, data) => {
        return axiosInstance.put(`/events/${id}`, data);
    },

    deleteEvent: (id) => {
        return axiosInstance.delete(`/events/${id}`);
    },

    toggleEventStatus: (id) => {
        return axiosInstance.patch(`/events/${id}/toggle`);
    },

    uploadDesign: (id, data) => {
        return axiosInstance.post(`/events/${id}/designs`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    uploadEventImage: (id, data) => {
        return axiosInstance.post(`/events/${id}/image`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    updateStudio: (eventId, designId, data) => {
        return axiosInstance.put(`/events/${eventId}/designs/${designId}/studio`, data);
    },

    deleteDesign: (eventId, designId) => {
        return axiosInstance.delete(`/events/${eventId}/designs/${designId}`);
    }
};

export default eventsApi;
