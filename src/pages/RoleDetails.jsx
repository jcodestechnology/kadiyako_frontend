import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Card, Checkbox, Row, Col, Typography, Skeleton, Result, Tag } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, TeamOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axios';

const { Title, Text } = Typography;

const RoleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roleRes, permsRes] = await Promise.all([
          axiosInstance.post('/roles/details', { id }),
          axiosInstance.get('/permissions', { params: { take: 200 } })
        ]);
        
        const roleData = roleRes.data.data || roleRes.data;
        setRole(roleData);
        setPermissions(permsRes.data.data || permsRes.data);

        form.setFieldsValue({
          name: roleData.name,
          slug: roleData.slug,
          description: roleData.description,
          permission_ids: roleData.permissions?.map(p => p.id),
        });
      } catch (error) {
        message.error('Failed to load role details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, form]);

  const onFinish = async (values) => {
    setSaveLoading(true);
    try {
      await axiosInstance.put(`/roles/${id}`, values);
      message.success('Role and permissions updated successfully');
      navigate('/roles');
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
          <Col span={9}><Skeleton active paragraph={{ rows: 6 }} /></Col>
          <Col span={15}><Skeleton active paragraph={{ rows: 12 }} /></Col>
        </Row>
      </div>
    );
  }
  if (!role) return <Result status="404" title="Role Not Found" extra={<Button onClick={() => navigate('/roles')}>Back to List</Button>} />;

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const group = perm.slug.split('.')[0] || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/roles')} />
          <h2 className="page-header-title">Role & Permissions Assignment</h2>
        </div>
        <Tag color={role.is_system ? 'gold' : 'blue'} style={{ fontSize: '14px', padding: '4px 12px' }}>
          {role.is_system ? 'System Role' : 'Custom Role'}
        </Tag>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Row gutter={24}>
          <Col xs={24} lg={9}>
            <Card title={<Space><TeamOutlined /> Role Information</Space>} className="premium-card">
              <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Administrator" disabled={role.is_system} />
              </Form.Item>
              <Form.Item name="slug" label="Role Slug" rules={[{ required: true }]}>
                <Input placeholder="e.g. admin" disabled={role.is_system} />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={4} placeholder="What can users with this role do?" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={15}>
            <Card title={<Space><SafetyCertificateOutlined /> Permission Matrix</Space>} className="premium-card">
              <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>
                Select the permissions that should be granted to all users assigned to this role.
              </Text>
              
              <Form.Item name="permission_ids">
                <Checkbox.Group style={{ width: '100%' }}>
                  <div className="scrollable-permissions">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {Object.keys(groupedPermissions).map(group => (
                        <div key={group}>
                          <div style={{ 
                            background: 'linear-gradient(90deg, #f0f7ff 0%, #ffffff 100%)', 
                            padding: '8px 16px', 
                            borderRadius: '8px', 
                            borderLeft: '4px solid #0892d0',
                            marginBottom: '16px'
                          }}>
                            <Text strong style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', color: '#0892d0' }}>
                              {group} Module
                            </Text>
                          </div>
                          <Row gutter={[16, 16]} style={{ paddingLeft: '8px' }}>
                            {groupedPermissions[group].map(perm => (
                              <Col xs={24} sm={12} key={perm.id}>
                                <Checkbox value={perm.id} className="custom-checkbox">
                                  {perm.name}
                                </Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ))}
                    </div>
                  </div>
                </Checkbox.Group>
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/roles')} style={{ width: '120px' }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saveLoading} icon={<SaveOutlined />} style={{ width: '180px' }}>
              Update Permissions
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default RoleDetails;
