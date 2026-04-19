import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, message, Button, Modal, Form, Input, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Title } = Typography;

const Permissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPermission, setCurrentPermission] = useState(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/permissions');
      const data = response.data.data || response.data;
      setPermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Failed to load permissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const showCreateModal = () => {
    setIsEditMode(false);
    setCurrentPermission(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (permission) => {
    setIsEditMode(true);
    setCurrentPermission(permission);
    form.setFieldsValue({
      name: permission.name,
      slug: permission.slug
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
        await axiosInstance.put(`/permissions/${currentPermission.id}`, values);
        message.success('Permission updated successfully');
      } else {
        await axiosInstance.post('/permissions', values);
        message.success('Permission created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchPermissions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Action failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/permissions/${id}`);
      message.success('Permission deleted successfully');
      fetchPermissions();
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
            title="Delete the permission"
            description="Are you sure to delete this permission?"
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
        <Title level={2} style={{ margin: 0 }}>Permissions Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
          Create Permission
        </Button>
      </div>
      
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={permissions} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEditMode ? "Edit Permission" : "Create New Permission"}
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
            label="Permission Name"
            rules={[{ required: true, message: 'Please input the permission name!' }]}
          >
            <Input placeholder="e.g. Edit Posts" />
          </Form.Item>
          
          <Form.Item
            name="slug"
            label="Permission Slug"
            rules={[{ required: true, message: 'Please input the permission slug!' }]}
          >
            <Input placeholder="e.g. posts.edit" />
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

export default Permissions;
