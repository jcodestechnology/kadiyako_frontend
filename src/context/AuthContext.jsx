import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { Spin } from 'antd';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get('/me');
      setUser(response.data.data || response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    const { token } = response.data;
    localStorage.setItem('token', token);
    await fetchUser();
    return response;
  };

  const register = async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    const { token } = response.data;
    localStorage.setItem('token', token);
    await fetchUser();
    return response;
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
