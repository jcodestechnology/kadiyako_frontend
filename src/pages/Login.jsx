import React, { useState } from 'react';
import { Form, Input, Button, Tabs, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinishPassword = async (values) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Login successful!');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishOTP = (values) => {
    // Mockup for OTP, no functional logic yet as requested
    setLoading(true);
    setTimeout(() => {
      message.info(`OTP validation logic to be implemented. Email/Phone: ${values.identifier}`);
      setLoading(false);
    }, 1000);
  };

  const items = [
    {
      key: '1',
      label: 'Password',
      children: (
        <Form
          name="login_password"
          layout="vertical"
          onFinish={onFinishPassword}
          size="large"
          className="auth-form"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your Email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Email Address" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: '2',
      label: 'OTP',
      children: (
        <Form
          name="login_otp"
          layout="vertical"
          onFinish={onFinishOTP}
          size="large"
          className="auth-form"
        >
          <Form.Item
            name="identifier"
            rules={[
              { required: true, message: 'Please input your Email or Phone Number!' }
            ]}
          >
            <Input prefix={<MobileOutlined className="site-form-item-icon" />} placeholder="Email or Phone Number" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
             <Form.Item
                name="otp"
                rules={[{ required: true, message: 'Please enter OTP!' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input prefix={<KeyOutlined className="site-form-item-icon" />} placeholder="Enter OTP" />
              </Form.Item>
              <Button type="default" size="large" onClick={() => message.success('OTP Sent!')}>
                Send OTP
              </Button>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block>
              Verify & Sign In
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="auth-page-container">
      <div className="auth-side-panel">
        <div className="auth-side-content">
          <div className="auth-side-logo-wrapper animate-fade-in">
            <img src="/LOGO1.png" alt="Kadiyako Logo" className="auth-side-logo" />
            <h1 className="auth-side-brand-name">KADI YAKO</h1>
          </div>
          <Title level={2} className="animate-fade-in" style={{ color: 'white', marginTop: '32px', fontWeight: 600 }}>Manage Events Seamlessly</Title>
          <Text className="animate-fade-in-delayed" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', lineHeight: '1.6', display: 'block', maxWidth: '380px', marginTop: '16px' }}>
            The ultimate digital platform for managing event invitation cards and contribution tracking. Easily create, send, and manage your events.
          </Text>
          <div className="auth-side-features">
            <div className="feature-item fade-in-up-1">
              <div className="feature-icon-wrapper">✉️</div>
              <Text style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>Digital Invitation Cards</Text>
            </div>
            <div className="feature-item fade-in-up-2">
              <div className="feature-icon-wrapper">💰</div>
              <Text style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>Contribution Tracking</Text>
            </div>
            <div className="feature-item fade-in-up-3">
              <div className="feature-icon-wrapper">🔔</div>
              <Text style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>Automated Reminders</Text>
            </div>
          </div>
        </div>
        <div className="auth-side-footer animate-fade-in-delayed">
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            KADIYAKO ©{new Date().getFullYear()} Developed by <a href="https://abbelinedigital.co.tz/" target="_blank" rel="noopener noreferrer" style={{ color: '#69c0ff', fontWeight: '500' }}>Abbeline Digital</a>
          </Text>
        </div>
      </div>
      
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-card-brand">
             <img src="/LOGO2.png" alt="Kadiyako Logo" className="auth-card-logo" />
          </div>
          <div className="auth-header">
            <Title level={3}>Sign In</Title>
            <Text type="secondary">Access your dashboard</Text>
          </div>
          
          <Tabs defaultActiveKey="1" items={items} centered className="auth-tabs" />
        </div>
      </div>
    </div>
  );
};

export default Login;
