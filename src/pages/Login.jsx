import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
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

  return (
    <Layout className="auth-layout">
      <div className="auth-container">
        <Card className="auth-card" bordered={false}>
          <div className="auth-brand">
            <Title level={1} className="brand-title">KADIYAKO</Title>
          </div>
          <div className="auth-header">
            <Text type="secondary">Sign in to continue to your dashboard</Text>
          </div>
          
          <Form
            name="login_form"
            layout="vertical"
            onFinish={onFinish}
            size="large"
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
            
            <div className="auth-footer">
              <Text>Don't have an account? <Link to="/register">Register here</Link></Text>
            </div>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
