import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, message, Button, Modal, Form, Input, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Title } = Typography;

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/roles');
      const data = response.data.data || response.data;
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Failed to load roles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const showCreateModal = () => {
    setIsEditMode(false);
    setCurrentRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (role) => {
    setIsEditMode(true);
    setCurrentRole(role);
    form.setFieldsValue({
      name: role.name,
      slug: role.slug
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      if (isEditMode) {
        await axiosInstance.put(`/roles/${currentRole.id}`, values);
        message.success('Role updated successfully');
      } else {
        await axiosInstance.post('/roles', values);
        message.success('Role created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchRoles();
    } catch (error) {
      message.error(error.response?.data?.message || 'Action failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/roles/${id}`);
      message.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      message.error(error.response?.data?.message || 'Deletion failed');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)} 
            disabled={record.is_system}
          />
          <Popconfirm
            title="Delete the role"
            description="Are you sure to delete this role?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.is_system}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              disabled={record.is_system}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Roles Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
          Create Role
        </Button>
      </div>
      
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={roles} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEditMode ? "Edit Role" : "Create New Role"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please input the role name!' }]}
          >
            <Input placeholder="e.g. Editor" />
          </Form.Item>
          
          <Form.Item
            name="slug"
            label="Role Slug"
            rules={[{ required: true, message: 'Please input the role slug!' }]}
          >
            <Input placeholder="e.g. editor" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Roles;
