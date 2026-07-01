import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, message, Typography, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Title, Paragraph } = Typography;

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingPackage, setEditingPackage] = useState(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/packages');
      setPackages(response.data.data || []);
    } catch (error) {
      message.error('Failed to load packages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const showModal = (record = null) => {
    setEditingPackage(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        features: record.features || []
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
        is_popular: false,
        sort_order: 0,
        features: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const handleNameChange = (e) => {
    // Auto-generate slug from name if not editing
    if (!editingPackage) {
      const name = e.target.value;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      form.setFieldsValue({ slug });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingPackage) {
        await axiosInstance.put(`/packages/${editingPackage.id}`, values);
        message.success('Package updated successfully.');
      } else {
        await axiosInstance.post('/packages', values);
        message.success('Package created successfully.');
      }
      
      setIsModalOpen(false);
      setEditingPackage(null);
      fetchPackages();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save package.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/packages/${id}`);
      message.success('Package deleted successfully.');
      fetchPackages();
    } catch (error) {
      message.error('Failed to delete package.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Sort Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      sorter: (a, b) => a.sort_order - b.sort_order,
      width: 100,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span style={{ fontWeight: 600 }}>
          {text} {record.is_popular && <Tag color="gold">Popular</Tag>}
        </span>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => <code style={{ fontSize: '12px' }}>{text}</code>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (text, record) => (
        <span style={{ color: '#0892d0', fontWeight: 'bold' }}>
          {text} {record.price_detail}
        </span>
      ),
    },
    {
      title: 'Features',
      dataIndex: 'features',
      key: 'features',
      render: (features) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '350px' }}>
          {features && features.map((feature, idx) => (
            <Tag key={idx} color={feature.startsWith('❌') ? 'red' : 'blue'} style={{ margin: '2px 0' }}>
              {feature}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
            onClick={() => showModal(record)} 
          />
          <Popconfirm
            title="Are you sure you want to delete this package?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Package Management</Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Manage the pricing plans and features displayed on the public landing page.
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          style={{ background: '#0892d0', border: 'none', borderRadius: '8px' }}
          onClick={() => showModal()}
        >
          Add Package
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={packages} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
            <GiftOutlined style={{ color: '#0892d0', fontSize: '20px' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{editingPackage ? 'Edit Package' : 'Create Package'}</span>
          </div>
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText={editingPackage ? 'Save Changes' : 'Create Package'}
        cancelText="Cancel"
        okButtonProps={{ style: { background: '#0892d0', border: 'none', borderRadius: '6px' } }}
        cancelButtonProps={{ style: { borderRadius: '6px' } }}
        width={580}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            name="name"
            label="Package Name"
            rules={[{ required: true, message: 'Please input package name!' }]}
          >
            <Input placeholder="e.g. Premium Host" onChange={handleNameChange} />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug (Unique Identifier)"
            rules={[{ required: true, message: 'Please input slug!' }]}
          >
            <Input placeholder="e.g. premium-host" disabled={!!editingPackage} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="price"
              label="Price Text"
              rules={[{ required: true, message: 'Please input price text!' }]}
            >
              <Input placeholder="e.g. 99,000 TZS or Free or Contact Us" />
            </Form.Item>

            <Form.Item
              name="price_detail"
              label="Price Detail (Suffix)"
            >
              <Input placeholder="e.g. /event or /month" />
            </Form.Item>
          </div>

          <Form.Item
            name="features"
            label="Features (Press Enter to add tag)"
            rules={[{ required: true, type: 'array', message: 'Please add at least one feature!' }]}
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Type feature and press Enter (use ❌ prefix for disabled features)"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'center', background: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
            <Form.Item
              name="sort_order"
              label="Sort Order"
              rules={[{ required: true }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="is_popular"
              label="Is Popular?"
              valuePropName="checked"
              style={{ marginBottom: 0, textAlign: 'center' }}
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Is Active?"
              valuePropName="checked"
              style={{ marginBottom: 0, textAlign: 'center' }}
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Packages;
