import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Space, Modal, Form, Input, message, Popconfirm, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import smsTemplatesApi from '../../api/smsTemplatesApi';

const { TextArea } = Input;
const { Text } = Typography;

const MessageTemplates = () => {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [form] = Form.useForm();

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await smsTemplatesApi.getTemplates();
            setTemplates(res.data);
        } catch (err) {
            message.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const showModal = (template = null) => {
        setEditingTemplate(template);
        if (template) {
            form.setFieldsValue(template);
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingTemplate(null);
        form.resetFields();
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            if (editingTemplate) {
                await smsTemplatesApi.updateTemplate(editingTemplate.hash_id, values);
                message.success('Template updated successfully');
            } else {
                await smsTemplatesApi.createTemplate(values);
                message.success('Template created successfully');
            }
            fetchTemplates();
            handleCancel();
        } catch (err) {
            message.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await smsTemplatesApi.deleteTemplate(id);
            message.success('Template deleted successfully');
            fetchTemplates();
        } catch (err) {
            message.error('Failed to delete template');
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Content Preview',
            dataIndex: 'content',
            key: 'content',
            render: (text) => (
                <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 400 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this template?"
                        onConfirm={() => handleDelete(record.hash_id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
            <Card 
                title={
                    <Space size="middle">
                        <FileTextOutlined style={{ color: '#0892d0' }} />
                        <span style={{ fontWeight: 600 }}>SMS Templates</span>
                    </Space>
                }
                extra={
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => showModal()}
                        style={{ borderRadius: 8 }}
                    >
                        New Template
                    </Button>
                }
                headStyle={{ padding: '0 24px', minHeight: 64 }}
                bodyStyle={{ padding: 0 }}
                style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}
            >
                <Table
                    columns={columns}
                    dataSource={templates}
                    rowKey="hash_id"
                    loading={loading}
                    scroll={{ x: 600 }}
                    pagination={{ pageSize: 10 }}
                    style={{ padding: '0 12px 12px' }}
                />

                <Modal
                    title={
                        <Space>
                            <FileTextOutlined style={{ color: '#0892d0' }} />
                            <span>{editingTemplate ? 'Edit Template' : 'Create Template'}</span>
                        </Space>
                    }
                    open={isModalVisible}
                    onCancel={handleCancel}
                    onOk={() => form.submit()}
                    confirmLoading={loading}
                    width={600}
                    centered
                    okText={editingTemplate ? 'Update' : 'Save'}
                    bodyStyle={{ padding: '24px' }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                    >
                        <Form.Item
                            name="title"
                            label="Template Title"
                            rules={[{ required: true, message: 'Please enter template title' }]}
                        >
                            <Input size="large" placeholder="e.g., Ahadi Reminder" style={{ borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item
                            name="content"
                            label="Message Content"
                            rules={[{ required: true, message: 'Please enter message content' }]}
                            help={
                                <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Placeholders: <Tag>[NAME]</Tag> <Tag>[AHADI]</Tag> <Tag>[KILICHOTOLEWA]</Tag> <Tag>[KILICHOBAKI]</Tag>
                                    </Text>
                                </div>
                            }
                        >
                            <TextArea rows={6} placeholder="Type your message here..." style={{ borderRadius: 8 }} />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default MessageTemplates;
