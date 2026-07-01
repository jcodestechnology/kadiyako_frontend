import axiosInstance from './axios';

const accessApi = {
    verifyCard: (cardNumber) => axiosInstance.get(`/verify-card/${cardNumber}`),
};

export default accessApi;
