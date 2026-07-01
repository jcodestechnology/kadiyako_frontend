import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Modal, Descriptions, Badge, Space, Input, Tag, message } from 'antd';
import { EyeOutlined, ReloadOutlined, MessageOutlined, SearchOutlined } from '@ant-design/icons';
import messagesApi from '../../api/messagesApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SentMessages = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const res = await messagesApi.history({
                page: params.pagination?.current || pagination.current,
                per_page: params.pagination?.pageSize || pagination.pageSize,
                ...params.filters
            });
            setData(res.data.data);
            setPagination({
                ...pagination,
                total: res.data.total,
                current: res.data.current_page
            });
        } catch (err) {
            message.error("Failed to load message history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTableChange = (newPagination, filters, sorter) => {
        fetchData({ pagination: newPagination, filters });
    };

    const showDetails = (record) => {
        setSelectedMessage(record);
        setModalVisible(true);
    };

    const refreshStatus = async (messageId) => {
        setRefreshing(true);
        try {
            const res = await messagesApi.refreshStatus(messageId);
            message.success(res.data.message || "Status updated");
            // Update local state for the modal
            if (selectedMessage && selectedMessage.hash_id === messageId) {
                setSelectedMessage({ ...selectedMessage, status: res.data.status || 'DELIVERED' });
            }
            // Refresh table
            fetchData();
        } catch (err) {
            message.error(err.response?.data?.message || "Could not retrieve latest status");
        } finally {
            setRefreshing(false);
        }
    };

    const columns = [
        {
            title: 'Recipient',
            dataIndex: 'recipient_name',
            key: 'recipient_name',
            width: 200,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text || 'Unknown'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.recipient_phone}</Text>
                </Space>
            )
        },
        {
            title: 'Event',
            dataIndex: ['event', 'name'],
            key: 'event_name',
            render: (text) => <Tag color="blue" style={{ borderRadius: 6 }}>{text || 'General'}</Tag>
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={type === 'reminder' ? 'orange' : 'cyan'} style={{ borderRadius: 6, fontSize: 11 }}>
                    {type === 'reminder' ? 'REMINDER' : 'NORMAL'}
                </Tag>
            )
        },
        {
            title: 'Sent At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => (
                <div style={{ fontSize: 13 }}>
                    <div>{dayjs(date).format('MMM DD, YYYY')}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 11 }}>{dayjs(date).format('HH:mm')}</div>
                </div>
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Button type="text" icon={<EyeOutlined />} onClick={() => showDetails(record)} style={{ color: '#0892d0' }}>View</Button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <Card 
                title={
                    <Space size="middle">
                        <div style={{ width: 40, height: 40, background: '#e6f7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageOutlined style={{ color: '#0892d0', fontSize: 20 }} />
                        </div>
                        <Title level={4} style={{ margin: 0 }}>Communication History</Title>
                    </Space>
                }
                extra={
                    <Button icon={<ReloadOutlined />} onClick={() => fetchData()} loading={loading}>
                        Refresh
                    </Button>
                }
                style={{ borderRadius: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: 'none' }}
            >
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="hash_id"
                    pagination={pagination}
                    loading={loading}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }} // Enables horizontal scroll on mobile
                    className="responsive-table"
                />
            </Card>

            <Modal
                title={
                    <Space>
                        <MessageOutlined style={{ color: '#0892d0' }} />
                        <span>Message Log Details</span>
                    </Space>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" shape="round" onClick={() => setModalVisible(false)}>Dismiss</Button>,
                    <Button 
                        key="refresh" 
                        type="primary" 
                        shape="round"
                        icon={<ReloadOutlined spin={refreshing} />} 
                        onClick={() => refreshStatus(selectedMessage?.hash_id)}
                        loading={refreshing}
                    >
                        Sync Status
                    </Button>
                ]}
                width={600}
                centered
                bodyStyle={{ padding: '24px' }}
            >
                {selectedMessage && (
                    <Descriptions column={1} bordered size="middle" labelStyle={{ fontWeight: 600, width: 140 }}>
                        <Descriptions.Item label="Recipient">
                            <Text strong>{selectedMessage.recipient_name}</Text>
                            <br />
                            <Text type="secondary">{selectedMessage.recipient_phone}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Associated Event">
                            <Tag color="blue">{selectedMessage.event?.name || 'Manual Broadcast'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Delivery Status">
                            <Badge 
                                status={selectedMessage.status === 'DELIVERED' ? 'success' : 'processing'} 
                                text={<Text strong color={selectedMessage.status === 'DELIVERED' ? '#52c41a' : '#1890ff'}>{selectedMessage.status || 'PENDING'}</Text>} 
                            />
                        </Descriptions.Item>
                        <Descriptions.Item label="Timestamp">{dayjs(selectedMessage.created_at).format('MMMM DD, YYYY [at] HH:mm:ss')}</Descriptions.Item>
                        <Descriptions.Item label="Actual Message Content">
                            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', border: '1px solid #f0f0f0', fontStyle: 'italic', color: '#595959' }}>
                                "{selectedMessage.message || selectedMessage.content}"
                            </div>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default SentMessages;
