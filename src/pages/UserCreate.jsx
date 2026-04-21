import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Select, Divider, message, Card, Checkbox, Row, Col, Typography, Skeleton, Tag } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const { Title, Text } = Typography;

const UserCreate = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          axiosInstance.get('/roles', { params: { take: 100 } }),
          axiosInstance.get('/permissions', { params: { take: 200 } })
        ]);
        setRoles(rolesRes.data.data || rolesRes.data);
        setPermissions(permsRes.data.data || permsRes.data);
      } catch (error) {
        message.error('Failed to load access data');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleValuesChange = (changedValues, allValues) => {
    if (changedValues.role_ids) {
      // Get all permissions from selected roles
      const selectedRoleIds = changedValues.role_ids;
      const rolePermissions = roles
        .filter(role => selectedRoleIds.includes(role.id))
        .flatMap(role => role.permissions?.map(p => p.id) || []);
      
      // Merge with current manual permissions (unique)
      const currentPermissions = form.getFieldValue('permission_ids') || [];
      const combinedPermissions = Array.from(new Set([...currentPermissions, ...rolePermissions]));
      
      form.setFieldsValue({ permission_ids: combinedPermissions });
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.post('/users', values);
      message.success('User registered successfully');
      navigate('/users');
    } catch (error) {
      message.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by prefix for better organization
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const group = perm.slug.split('.')[0] || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  const getInheritedPermissions = () => {
    const selectedRoleIds = form.getFieldValue('role_ids') || [];
    return roles
      .filter(role => selectedRoleIds.includes(role.id))
      .flatMap(role => role.permissions?.map(p => p.id) || []);
  };

  const inheritedIds = getInheritedPermissions();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/users')}
          style={{ borderRadius: '8px' }}
        />
        <h2 className="page-header-title">Register New User</h2>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={handleValuesChange} requiredMark={false}>
        <Row gutter={24}>
          <Col xs={24} lg={10}>
            <Card title={<Space><UserOutlined /> Basic Information</Space>} className="premium-card">
              <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Enter full name" />
              </Form.Item>
              <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="email@example.com" />
              </Form.Item>
              <Form.Item name="phone" label="Phone Number">
                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="+255..." />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="At least 8 characters" />
              </Form.Item>
            </Card>

            <Card title={<Space><SafetyCertificateOutlined /> Role Assignment</Space>} className="premium-card" style={{ marginTop: '24px' }}>
              <Skeleton loading={loadingData} active paragraph={{ rows: 2 }}>
                <Form.Item name="role_ids" label="Assign Roles" extra="Users will inherit permissions from these roles.">
                  <Select mode="multiple" placeholder="Select roles" style={{ width: '100%' }}>
                    {roles.map(role => (
                      <Select.Option key={role.id} value={role.id}>{role.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Skeleton>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title={<Space><SafetyCertificateOutlined /> Direct Permissions Assignment</Space>} className="premium-card">
              <Skeleton loading={loadingData} active paragraph={{ rows: 12 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>
                  You can assign specific permissions directly to this user. These are in addition to role permissions.
                </Text>
                
                <Form.Item name="permission_ids">
                  <Checkbox.Group style={{ width: '100%' }}>
                    <div className="scrollable-permissions">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {Object.keys(groupedPermissions).map(group => (
                          <div key={group} className="permissions-group-card">
                            <Text strong style={{ textTransform: 'capitalize', color: '#0892d0', display: 'block', marginBottom: '12px' }}>
                              {group} Management
                            </Text>
                            <Row gutter={[16, 12]}>
                              {groupedPermissions[group].map(perm => {
                                const isInherited = inheritedIds.includes(perm.id);
                                return (
                                  <Col xs={24} sm={12} key={perm.id}>
                                    <Checkbox value={perm.id} className="custom-checkbox">
                                      {perm.name}
                                      {isInherited && (
                                        <Tag color="orange" style={{ marginLeft: '8px', fontSize: '10px', lineHeight: '16px', height: '18px', padding: '0 4px', borderRadius: '4px' }}>
                                          From Role
                                        </Tag>
                                      )}
                                    </Checkbox>
                                  </Col>
                                );
                              })}
                            </Row>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Checkbox.Group>
                </Form.Item>
              </Skeleton>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/users')} style={{ width: '120px' }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} style={{ width: '180px' }}>
              Register User
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default UserCreate;
