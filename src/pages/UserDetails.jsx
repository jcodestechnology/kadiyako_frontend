import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Select, Divider, message, Card, Checkbox, Row, Col, Typography, Tag, Skeleton, Result } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, SafetyCertificateOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axios';

const { Title, Text } = Typography;

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, rolesRes, permsRes] = await Promise.all([
          axiosInstance.post('/users/details', { id }),
          axiosInstance.get('/roles', { params: { take: 100 } }),
          axiosInstance.get('/permissions', { params: { take: 200 } })
        ]);
        
        const userData = userRes.data.data || userRes.data;
        setUser(userData);
        setRoles(rolesRes.data.data || rolesRes.data);
        setPermissions(permsRes.data.data || permsRes.data);

        form.setFieldsValue({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role_ids: userData.roles?.map(r => r.id),
          permission_ids: (userData.direct_permissions || userData.permissions)?.map(p => p.id) || [],
        });
      } catch (error) {
        message.error('Failed to load user details');
      } finally {
        setLoading(false);
        setLoadingData(false);
      }
    };
    fetchData();
  }, [id, form]);

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
    setSaveLoading(true);
    try {
      await axiosInstance.put(`/users/${id}`, values);
      message.success('User updated successfully');
      navigate('/users');
    } catch (error) {
      message.error(error.response?.data?.message || 'Update failed');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton active avatar paragraph={{ rows: 4 }} />
        <Row gutter={24} style={{ marginTop: '24px' }}>
          <Col span={10}><Skeleton active paragraph={{ rows: 6 }} /></Col>
          <Col span={14}><Skeleton active paragraph={{ rows: 10 }} /></Col>
        </Row>
      </div>
    );
  }
  if (!user) return <Result status="404" title="User Not Found" extra={<Button onClick={() => navigate('/users')}>Back to List</Button>} />;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')} />
          <h2 className="page-header-title">User Details & Permissions</h2>
        </div>
        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '6px' }}>
          ID: #{user.id}
        </Tag>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={handleValuesChange} requiredMark={false}>
        <Row gutter={24}>
          <Col xs={24} lg={10}>
            <Card title={<Space><UserOutlined /> Profile Information</Space>} className="premium-card">
              <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
              <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
              <Form.Item name="phone" label="Phone Number">
                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
              <Form.Item name="password" label="Change Password" extra="Leave blank to keep current password.">
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="New password" />
              </Form.Item>
              <Divider />
              <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                <Space direction="vertical" size={4}>
                  <span><CalendarOutlined /> Joined: {new Date(user.created_at).toLocaleString()}</span>
                  <span><CalendarOutlined /> Last Update: {new Date(user.updated_at).toLocaleString()}</span>
                </Space>
              </div>
            </Card>

            <Card title={<Space><SafetyCertificateOutlined /> Inherited Access (Roles)</Space>} className="premium-card" style={{ marginTop: '24px' }}>
              <Skeleton loading={loadingData} active paragraph={{ rows: 2 }}>
                <Form.Item name="role_ids" label="Assign Roles">
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
            <Card title={<Space><SafetyCertificateOutlined /> Custom Direct Permissions</Space>} className="premium-card">
              <Skeleton loading={loadingData} active paragraph={{ rows: 12 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>
                  These permissions are assigned specifically to this user and persist regardless of their roles.
                </Text>
                
                <Form.Item name="permission_ids">
                  <Checkbox.Group style={{ width: '100%' }}>
                    <div className="scrollable-permissions">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {Object.keys(groupedPermissions).map(group => (
                          <div key={group} className="permissions-group-card">
                            <Text strong style={{ textTransform: 'capitalize', color: '#0892d0', display: 'block', marginBottom: '12px' }}>
                              {group} Permissions
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
            <Button type="primary" htmlType="submit" loading={saveLoading} icon={<SaveOutlined />} style={{ width: '180px' }}>
              Save Changes
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default UserDetails;
