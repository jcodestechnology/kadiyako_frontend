import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register(values);
      message.success('Registration successful!');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
      <div className="auth-container" style={{ width: '100%', maxWidth: '500px' }}>
        <Card className="auth-card" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div className="auth-brand" style={{ marginBottom: '24px' }}>
            <Title level={2} className="brand-title" style={{ fontSize: '24px' }}>KADIYAKO</Title>
            <Text className="brand-subtitle" style={{ fontSize: '14px' }}>Register New User</Text>
          </div>
          <div className="auth-header" style={{ marginBottom: '24px', textAlign: 'left' }}>
            <Title level={4}>Create an Account</Title>
            <Text type="secondary">Add a new user to the system</Text>
          </div>
          
          <Form
            name="register_form"
            layout="vertical"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please input the Name!' }]}
            >
              <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Full Name" />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input the Email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="Email Address" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input the Password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Password"
              />
            </Form.Item>
            <Form.Item
              name="password_confirmation"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm the password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Confirm Password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block>
                Register User
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
