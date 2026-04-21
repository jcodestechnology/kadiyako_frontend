import React, { useState, useEffect, useRef } from 'react';
import { Table, Typography, message, Tag, Input, Space, Button, Popconfirm, Skeleton } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const { Text } = Typography;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
    },
    search: '',
  });

  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);

  const fetchUsers = async (params = tableParams) => {
    try {
      setLoading(true);
      const skip = (params.pagination.current - 1) * params.pagination.pageSize;
      
      const response = await axiosInstance.get('/users', {
        params: {
          search: params.search,
          skip: skip,
          take: params.pagination.pageSize,
        }
      });
      
      const data = response.data.data || response.data;
      const meta = response.data.meta;
      
      setUsers(Array.isArray(data) ? data : []);
      if (meta) {
        setTotal(meta.total);
      } else {
        setTotal(data.length);
      }
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      message.success('User deleted successfully');
      fetchUsers();
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
          {record.id === 1 && <Tag color="gold">System</Tag>}
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_, record) => (
        <Space wrap>
          {record.roles?.map((role) => (
            <Tag color="blue" key={role.id}>
              {role.name}
            </Tag>
          )) || <span style={{ color: '#8c8c8c' }}>None</span>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/users/${record.id}`)} 
            title="View Details"
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/users/${record.id}`)} 
            title="Edit User"
          />
          <Popconfirm
            title="Delete User"
            description="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.id === 1}
          >
            <Button type="text" danger icon={<DeleteOutlined />} disabled={record.id === 1} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="page-header-title">Users Management</h2>
        <Space>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onChange={handleSearch}
            style={{ width: 250, borderRadius: '10px' }}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/users/create')}
            style={{ borderRadius: '10px', height: '40px', padding: '0 20px' }}
          >
            Add New User
          </Button>
        </Space>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        {loading && users.length === 0 ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={users} 
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
    </div>
  );
};

export default Users;
