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
    }
};

export default eventsApi;
