import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Tabs, Typography, message, Modal, Space, Divider } from 'antd';
import {
    UserOutlined,
    LockOutlined,
    MobileOutlined,
    KeyOutlined,
    ArrowLeftOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import './Auth.css';

const { Title, Text } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: identify, 2: verify, 3: reset
    const [resetIdentifier, setResetIdentifier] = useState('');
    const [resetCode, setResetCode] = useState('');

    const navigate = useNavigate();
    const { user, login, fetchUser } = useAuth();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);
    const [formOtp] = Form.useForm();
    const [formForgot] = Form.useForm();

    // Countdown & Session Check
    useEffect(() => {
        // Check for expired session
        if (localStorage.getItem('session_expired') === 'true') {
            message.warning('Your session has expired. Please sign in again.');
            localStorage.removeItem('session_expired');
        }

        let timer;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    // Handle Password Login
    const onFinishPassword = async (values) => {
        setLoading(true);
        try {
            await login(values);
            message.success('Welcome back to KADIYAKO!');
            navigate('/dashboard');
        } catch (error) {
            message.error(error.response?.data?.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    // Send Login OTP
    const sendLoginOtp = async () => {
        const phone = formOtp.getFieldValue('phone');
        if (!phone) return message.warning('Please enter your phone number first.');

        setOtpLoading(true);
        try {
            await axiosInstance.post('/auth/otp/send-login', { phone });
            message.success('Verification code sent to ' + phone);
            setCountdown(60);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Handle OTP Login Verification
    const onFinishOTP = async (values) => {
        setLoading(true);
        try {
            const res = await axiosInstance.post('/auth/otp/verify-login', {
                phone: values.phone,
                code: values.otp
            });
            localStorage.setItem('token', res.data.access_token);
            if (fetchUser) await fetchUser();
            message.success('Authenticated successfully!');
            navigate('/dashboard');
        } catch (error) {
            message.error(error.response?.data?.message || 'Invalid or expired code.');
        } finally {
            setLoading(false);
        }
    };

    // --- Forgot Password Flow ---

    const handleForgotStep1 = async (values) => {
        setLoading(true);
        try {
            await axiosInstance.post('/auth/otp/send-reset', { identifier: values.identifier });
            setResetIdentifier(values.identifier);
            setForgotStep(2);
            message.success('Security code sent to your registered phone.');
        } catch (error) {
            message.error(error.response?.data?.message || 'User not found.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotStep2 = (values) => {
        setResetCode(values.code);
        setForgotStep(3);
    };

    const handleForgotStep3 = async (values) => {
        setLoading(true);
        try {
            await axiosInstance.post('/auth/otp/reset-password', {
                identifier: resetIdentifier,
                code: resetCode,
                password: values.password,
                password_confirmation: values.password_confirmation
            });
            message.success('Password reset successful! You can now login.');
            setIsForgotModalVisible(false);
            setForgotStep(1);
            formForgot.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: '1',
            label: 'Password',
            children: (
                <Form layout="vertical" onFinish={onFinishPassword} size="large" className="auth-form">
                    <Form.Item name="email" rules={[{ required: true, message: 'Email is required' }, { type: 'email' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Email Address" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>
                    <div style={{ textAlign: 'right', marginBottom: 24 }}>
                        <Button type="link" onClick={() => setIsForgotModalVisible(true)} style={{ padding: 0 }}>
                            Forgot Password?
                        </Button>
                    </div>
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
                <Form form={formOtp} layout="vertical" onFinish={onFinishOTP} size="large" className="auth-form">
                    <Form.Item name="phone" rules={[{ required: true, message: 'Phone number is required' }]}>
                        <Input prefix={<MobileOutlined />} placeholder="Phone Number (e.g., 0712...)" />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <Form.Item name="otp" rules={[{ required: true, message: 'Code is required' }]} style={{ flex: 1, marginBottom: 0 }}>
                            <Input prefix={<KeyOutlined />} placeholder="6-digit code" maxLength={6} />
                        </Form.Item>
                        <Button
                            disabled={countdown > 0}
                            onClick={sendLoginOtp}
                            loading={otpLoading}
                            style={{ height: '50px', borderRadius: '12px', minWidth: '120px' }}
                        >
                            {countdown > 0 ? `${countdown}s` : 'Get Code'}
                        </Button>
                    </div>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block>
                            Verify & Enter
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
                    <div className="auth-side-logo-wrapper animate-fade-in" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <img src="/LOGO1.png" alt="Kadiyako Logo" className="auth-side-logo" />
                        <h1 className="auth-side-brand-name">KADI YAKO</h1>
                    </div>
                    <Title level={2} className="animate-fade-in" style={{ color: 'white', marginTop: '32px', fontWeight: 800 }}>Manage Events Seamlessly</Title>
                    <Text className="animate-fade-in-delayed" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', lineHeight: '1.6', display: 'block', maxWidth: '380px', marginTop: '16px' }}>
                        The ultimate digital platform for managing event invitation cards and contribution tracking.
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
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-container">
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', color: '#8c8c8c', marginBottom: 20, fontSize: 13, fontWeight: 500 }}>
                        <ArrowLeftOutlined style={{ marginRight: 6 }} /> Back to Home
                    </Link>
                    <div className="auth-card-brand">
                        <img src="/LOGO2.png" alt="Kadiyako Logo" className="auth-card-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div className="auth-header" style={{ textAlign: 'center', marginBottom: 32 }}>
                        <Title level={3} style={{ marginBottom: 8 }}>KADI YAKO</Title>
                        <Text type="secondary">Choose your preferred method to enter your workspace</Text>
                    </div>

                    <Tabs defaultActiveKey="1" items={items} centered className="auth-tabs" />
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Text type="secondary">Don't have an account? </Text>
                        <Link to="/register" style={{ fontWeight: 600, color: '#0892d0' }}>
                            Register as Host
                        </Link>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <Modal
                title={null}
                open={isForgotModalVisible}
                onCancel={() => { setIsForgotModalVisible(false); setForgotStep(1); }}
                footer={null}
                centered
                width={450}
                bodyStyle={{ padding: '32px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, background: '#e6f7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        {forgotStep === 1 ? <UserOutlined style={{ fontSize: 32, color: '#0892d0' }} /> :
                            forgotStep === 2 ? <SafetyCertificateOutlined style={{ fontSize: 32, color: '#52c41a' }} /> :
                                <LockOutlined style={{ fontSize: 32, color: '#faad14' }} />}
                    </div>
                    <Title level={4}>{forgotStep === 1 ? 'Find Your Account' : forgotStep === 2 ? 'Verify Identity' : 'New Password'}</Title>
                    <Text type="secondary">
                        {forgotStep === 1 ? 'Enter your registered email or phone number.' :
                            forgotStep === 2 ? `We sent a code to your registered phone.` :
                                'Create a strong new password for your account.'}
                    </Text>
                </div>

                <Form form={formForgot} layout="vertical" onFinish={forgotStep === 1 ? handleForgotStep1 : forgotStep === 2 ? handleForgotStep2 : handleForgotStep3} size="large">
                    {forgotStep === 1 && (
                        <Form.Item name="identifier" rules={[{ required: true, message: 'Field is required' }]}>
                            <Input placeholder="Email or Phone number" prefix={<UserOutlined />} />
                        </Form.Item>
                    )}

                    {forgotStep === 2 && (
                        <Form.Item name="code" rules={[{ required: true, message: 'Enter the code' }]}>
                            <Input placeholder="6-digit code" prefix={<KeyOutlined />} maxLength={6} />
                        </Form.Item>
                    )}

                    {forgotStep === 3 && (
                        <>
                            <Form.Item name="password" rules={[{ required: true, min: 8 }]}>
                                <Input.Password placeholder="New Password" prefix={<LockOutlined />} />
                            </Form.Item>
                            <Form.Item name="password_confirmation" dependencies={['password']} rules={[
                                { required: true },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                                        return Promise.reject(new Error('Passwords do not match!'));
                                    },
                                }),
                            ]}>
                                <Input.Password placeholder="Confirm Password" prefix={<LockOutlined />} />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 50, borderRadius: 12 }}>
                            {forgotStep === 3 ? 'Reset Password' : 'Continue'}
                        </Button>
                    </Form.Item>

                    {forgotStep > 1 && (
                        <Button type="link" block onClick={() => setForgotStep(prev => prev - 1)} style={{ marginTop: 12 }}>
                            <ArrowLeftOutlined /> Back
                        </Button>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default Login;
