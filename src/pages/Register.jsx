import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Steps } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  KeyOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import './Auth.css';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState(1); // Stage 1 or 2
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // Stored values from verified Stage 1
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [formStage1] = Form.useForm();
  const [formStage2] = Form.useForm();
  
  const navigate = useNavigate();
  const { user, register } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Stage 1: Send registration OTP
  const sendOtp = async () => {
    try {
      await formStage1.validateFields(['email', 'phone']);
    } catch (valError) {
      return message.warning('Please enter a valid email and phone number first.');
    }

    const email = formStage1.getFieldValue('email');
    const phone = formStage1.getFieldValue('phone');

    setOtpLoading(true);
    try {
      const res = await axiosInstance.post('/auth/otp/send-register', { phone, email });
      message.success(res.data.message || `Verification OTP sent to ${phone}`);
      setIsOtpSent(true);
      setCountdown(60);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Stage 1: Verify OTP and transition to Stage 2
  const handleVerifyOtp = async (values) => {
    const { email, phone, otp } = values;

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/otp/verify-register', { phone, code: otp });
      message.success(res.data.message || 'Phone number verified successfully!');
      
      // Store verified details
      setVerifiedPhone(phone);
      setVerifiedEmail(email);
      setOtpCode(otp);
      
      // Advance to Stage 2
      setStep(2);
    } catch (error) {
      message.error(error.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Stage 2: Profile Submission
  const handleRegisterSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        email: verifiedEmail,
        phone: verifiedPhone,
        password: values.password,
        password_confirmation: values.password_confirmation,
        otp_code: otpCode,
      };

      await register(payload);
      message.success('Registration successful! Welcome to KADI YAKO.');
      navigate('/dashboard');
    } catch (error) {
      message.error(error.response?.data?.message || 'Account creation failed. Please verify your OTP code.');
      // If OTP failed on backend, send them back to verify again
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left panel showing branding & features */}
      <div className="auth-side-panel">
        <div className="auth-side-content">
          <div className="auth-side-logo-wrapper animate-fade-in" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src="/LOGO2.png" alt="Kadiyako Logo" className="auth-side-logo" />
            <h1 className="auth-side-brand-name">KADI YAKO</h1>
          </div>
          <Title level={2} className="animate-fade-in" style={{ color: 'white', marginTop: '32px', fontWeight: 800 }}>
            Host Your Event Today
          </Title>
          <Text className="animate-fade-in-delayed" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', lineHeight: '1.6', display: 'block', maxWidth: '380px', marginTop: '16px' }}>
            Register as a Host to create custom invitation cards, manage guests, track contributions, and use QR code scanning.
          </Text>
          <div className="auth-side-features">
            <div className="feature-item fade-in-up-1">
              <div className="feature-icon-wrapper">✉️</div>
              <Text style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>Dynamic Custom Invitations</Text>
            </div>
            <div className="feature-item fade-in-up-2">
              <div className="feature-icon-wrapper">💰</div>
              <Text style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>Committee Pledge Tracking</Text>
            </div>
            <div className="feature-item fade-in-up-3">
              <div className="feature-icon-wrapper">🔒</div>
              <Text style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>Secure QR Entry Check-in</Text>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container" style={{ maxWidth: '460px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', color: '#8c8c8c', marginBottom: 20, fontSize: 13, fontWeight: 500 }}>
            <ArrowLeftOutlined style={{ marginRight: 6 }} /> Back to Home
          </Link>
          <div className="auth-card-brand">
            <img src="/LOGO2.png" alt="Kadiyako Logo" className="auth-card-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
          </div>
          
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 6 }}>KADI YAKO</Title>
            <Text type="secondary">Create a new host account and verify your phone number</Text>
          </div>

          {/* Steps Indicator */}
          <Steps
            current={step - 1}
            size="small"
            style={{ marginBottom: '24px' }}
            items={[
              { title: 'OTP Verify' },
              { title: 'Host Details' }
            ]}
          />

          {step === 1 ? (
            /* Stage 1 Form: Phone Verification */
            <Form
              form={formStage1}
              name="register_stage1"
              layout="vertical"
              size="large"
              onFinish={handleVerifyOtp}
            >
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Email address is required' },
                  { type: 'email', message: 'Enter a valid email' }
                ]}
              >
                <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="e.g. host@example.com" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Phone number is required (e.g., 0712XXXXXX)' }]}
              >
                <Input prefix={<MobileOutlined className="site-form-item-icon" />} placeholder="e.g. 0712XXXXXX" />
              </Form.Item>

              {isOtpSent && (
                <Form.Item
                  name="otp"
                  label="SMS Verification Code"
                  rules={[{ required: true, message: '6-digit OTP code is required' }]}
                >
                  <Input 
                    prefix={<KeyOutlined className="site-form-item-icon" />} 
                    placeholder="Enter 6-digit code" 
                    maxLength={6} 
                  />
                </Form.Item>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button
                  onClick={sendOtp}
                  loading={otpLoading}
                  style={{ flex: 1, height: '48px', borderRadius: '8px' }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : isOtpSent ? 'Resend Code' : 'Send Code'}
                </Button>
                
                {isOtpSent && (
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{ flex: 1, height: '48px', borderRadius: '8px', background: '#0892d0', border: 'none' }}
                  >
                    Verify & Continue
                  </Button>
                )}
              </div>
            </Form>
          ) : (
            /* Stage 2 Form: Host Details */
            <Form
              form={formStage2}
              name="register_stage2"
              layout="vertical"
              size="large"
              onFinish={handleRegisterSubmit}
            >
              <div style={{ background: '#f5f7f8', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eef1f2' }}>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Verified Phone:</div>
                <div style={{ fontWeight: 'bold', color: '#262626' }}>{verifiedPhone}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>Verified Email:</div>
                <div style={{ fontWeight: 'bold', color: '#262626' }}>{verifiedEmail}</div>
              </div>

              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Full name is required' }]}
              >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Full Name" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Password is required' }, { min: 8, message: 'Minimum 8 characters' }]}
              >
                <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Password" />
              </Form.Item>

              <Form.Item
                name="password_confirmation"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Confirm Password" />
              </Form.Item>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setStep(1)}
                  style={{ height: '48px', borderRadius: '8px' }}
                >
                  Back
                </Button>
                
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{ flex: 1, height: '48px', borderRadius: '8px', background: '#0892d0', border: 'none' }}
                >
                  Register & Host
                </Button>
              </div>
            </Form>
          )}

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text type="secondary">Already have an account? </Text>
            <Link to="/login" style={{ fontWeight: 600, color: '#0892d0' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
