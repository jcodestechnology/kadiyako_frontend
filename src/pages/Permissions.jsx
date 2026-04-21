import React, { useState, useEffect, useRef } from 'react';
import { Table, Typography, message, Button, Modal, Form, Input, Space, Popconfirm, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Title } = Typography;

const Permissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPermission, setCurrentPermission] = useState(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
    },
    search: '',
  });

  const searchTimeoutRef = useRef(null);

  const fetchPermissions = async (params = tableParams) => {
    try {
      setLoading(true);
      const skip = (params.pagination.current - 1) * params.pagination.pageSize;
      
      const response = await axiosInstance.get('/permissions', {
        params: {
          search: params.search,
          skip: skip,
          take: params.pagination.pageSize,
        }
      });
      
      const data = response.data.data || response.data;
      const meta = response.data.meta;
      
      setPermissions(Array.isArray(data) ? data : []);
      if (meta) {
        setTotal(meta.total);
      } else {
        setTotal(data.length);
      }
    } catch (error) {
      message.error('Failed to load permissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [tableParams.pagination.current, tableParams.pagination.pageSize, tableParams.search]);

  const handleTableChange = (pagination) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setTableParams({
        ...tableParams,
        search: value,
        pagination: { ...tableParams.pagination, current: 1 },
      });
    }, 500);
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="page-header-title">Permissions Management</h2>
        <Space>
          <Input
            placeholder="Search permissions..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onChange={handleSearch}
            style={{ width: 300, borderRadius: '8px' }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            Create Permission
          </Button>
        </Space>
      </div>
      
      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {loading && permissions.length === 0 ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={permissions} 
            rowKey="id" 
            loading={loading}
            pagination={{ 
              ...tableParams.pagination,
              total: total,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>

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
