import React, { useState, useEffect, useRef } from 'react';
import { Table, Typography, message, Button, Modal, Form, Input, Space, Popconfirm, Tag, Skeleton } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const { Text } = Typography;

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
    },
    search: '',
  });

  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);

  const fetchRoles = async (params = tableParams) => {
    try {
      setLoading(true);
      const skip = (params.pagination.current - 1) * params.pagination.pageSize;
      
      const response = await axiosInstance.get('/roles', {
        params: {
          search: params.search,
          skip: skip,
          take: params.pagination.pageSize,
        }
      });
      
      const data = response.data.data || response.data;
      const meta = response.data.meta;
      
      setRoles(Array.isArray(data) ? data : []);
      if (meta) {
        setTotal(meta.total);
      } else {
        setTotal(data.length);
      }
    } catch (error) {
      message.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
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
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      await axiosInstance.post('/roles', values);
      message.success('Role created successfully');
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
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.is_system && <Tag color="gold">System</Tag>}
        </Space>
      )
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => <Tag color="default">{text}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary"
            ghost
            size="small"
            icon={<SafetyCertificateOutlined />} 
            onClick={() => navigate(`/roles/${record.id}`)}
            style={{ borderRadius: '6px' }}
          >
            Permissions
          </Button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="page-header-title">Roles Management</h2>
        <Space>
          <Input
            placeholder="Search roles..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onChange={handleSearch}
            style={{ width: 250, borderRadius: '10px' }}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showCreateModal}
            style={{ borderRadius: '10px', height: '40px' }}
          >
            Create New Role
          </Button>
        </Space>
      </div>
      
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        {loading && roles.length === 0 ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={roles} 
            rowKey="id" 
            loading={loading}
            pagination={{ 
              ...tableParams.pagination,
              total: total,
              showSizeChanger: true,
              borderRadius: '8px'
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>

      <Modal
        title="Create New Role"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={400}
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
            <Input placeholder="e.g. Manager" />
          </Form.Item>
          
          <Form.Item
            name="slug"
            label="Role Slug"
            rules={[{ required: true, message: 'Please input the role slug!' }]}
          >
            <Input placeholder="e.g. manager" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                Create Role
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Roles;
