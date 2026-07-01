import React, { useState } from 'react';
import { Card, Row, Col, Typography, Input, Button, Upload, Avatar, Divider, message, Space, Form, Alert } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, CameraOutlined, SaveOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

const { Title, Text } = Typography;

const UserProfile = () => {
    const { user, fetchUser } = useAuth(); 
    const [loading, setLoading] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user?.profile_photo_url);
    const [form] = Form.useForm();
    const [pwdForm] = Form.useForm();

    const handleAvatarChange = (info) => {
        if (info.file.status === 'done' || info.file) {
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(info.file);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', values.name);
            
            if (values.avatar?.[0]?.originFileObj) {
                formData.append('profile_photo', values.avatar[0].originFileObj);
            }

            const res = await axiosInstance.post('/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local user context
            if (fetchUser) await fetchUser();

            message.success('Profile updated successfully');
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const onPasswordFinish = async (values) => {
        setPwdLoading(true);
        try {
            await axiosInstance.post('/profile/password', values);
            message.success('Password changed successfully');
            pwdForm.resetFields();
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Account Settings</Title>
                <Text type="secondary">Manage your personal information and security preferences.</Text>
            </div>

            <Row gutter={[32, 32]}>
                <Col xs={24} lg={16}>
                    <Card 
                        style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}
                        title={<Space><UserOutlined /><span>Personal Information</span></Space>}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                name: user?.name,
                                email: user?.email,
                                phone: user?.phone
                            }}
                        >
                            <Row gutter={24}>
                                <Col span={24} style={{ textAlign: 'center', marginBottom: 32 }}>
                                    <Form.Item name="avatar" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
                                        <Upload
                                            name="avatar"
                                            listType="picture-circle"
                                            className="avatar-uploader"
                                            showUploadList={false}
                                            beforeUpload={() => false}
                                            onChange={handleAvatarChange}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                <Avatar 
                                                    size={120} 
                                                    src={avatarPreview} 
                                                    icon={<UserOutlined />} 
                                                    style={{ border: '4px solid #fff', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                                                />
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    bottom: 0, 
                                                    right: 0, 
                                                    background: '#0892d0', 
                                                    width: 32, 
                                                    height: 32, 
                                                    borderRadius: '50%', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    border: '2px solid #fff'
                                                }}>
                                                    <CameraOutlined />
                                                </div>
                                            </div>
                                        </Upload>
                                    </Form.Item>
                                    <Text type="secondary">Click the avatar to upload a new profile photo.</Text>
                                </Col>

                                <Col xs={24}>
                                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                                        <Input size="large" prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Enter your full name" />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item name="email" label="Email Address">
                                        <Input size="large" prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} disabled />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="phone" label="Phone Number">
                                        <Input size="large" prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} disabled />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Alert 
                                message="Restricted Fields" 
                                description="Email and Phone number are used for authentication and cannot be changed here. Contact support if you need to update them."
                                type="info"
                                showIcon
                                style={{ borderRadius: 12, marginBottom: 24 }}
                            />

                            <Divider />
                            
                            <div style={{ textAlign: 'right' }}>
                                <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={loading} style={{ height: 50, padding: '0 40px', borderRadius: 12, fontWeight: 600 }}>
                                    Save Changes
                                </Button>
                            </div>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card 
                        style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}
                        title={<Space><LockOutlined /><span>Security Settings</span></Space>}
                    >
                        <Form
                            form={pwdForm}
                            layout="vertical"
                            onFinish={onPasswordFinish}
                        >
                            <Form.Item name="current_password" label="Current Password" rules={[{ required: true }]}>
                                <Input.Password size="large" prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />} />
                            </Form.Item>
                            
                            <Divider />
                            
                            <Form.Item name="password" label="New Password" rules={[{ required: true }, { min: 8 }]}>
                                <Input.Password size="large" prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} />
                            </Form.Item>
                            
                            <Form.Item name="password_confirmation" label="Confirm New Password" rules={[{ required: true }, ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match!'));
                                },
                            })]}>
                                <Input.Password size="large" prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} />
                            </Form.Item>

                            <Button type="primary" htmlType="submit" block size="large" icon={<KeyOutlined />} loading={pwdLoading} style={{ height: 50, borderRadius: 12, fontWeight: 600, marginTop: 16 }}>
                                Update Password
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UserProfile;
