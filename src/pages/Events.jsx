import React, { useState, useEffect, useRef } from 'react';
import {
  Table, Typography, message, Input, Space, Button,
  Popconfirm, Tag, Switch, Card, Badge, Tooltip, Row, Col, Tabs, Spin, Skeleton
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, CalendarOutlined, EnvironmentOutlined,
  AppstoreOutlined, UnorderedListOutlined, ClockCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import eventsApi from '../api/eventsApi';
import { listAdminTemplates, fetchAsBlob } from '../api/templatesApi';
import EventModal from '../components/Events/EventModal';

const { Text, Title, Paragraph } = Typography;

const EventCardImage = ({ event, templates }) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const load = async () => {
      // Loose comparison to handle string/number ID mismatches
      const template = templates.find(t => (t.id == event.template_id));
      
      if (!event.template_id || !templates.length || !template) {
        if (isMounted) setLoading(false);
        return;
      }

      const targetUrl = template.preview_url || template.file_url;
      if (!targetUrl) {
        if (isMounted) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const blob = await fetchAsBlob(targetUrl);
        if (!isMounted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (e) {
        console.error("Failed to load event card image", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [event.template_id, templates]);

  if (loading) return <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}><Spin size="small" /></div>;
  
  if (url) {
    return (
      <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
        <img src={url} alt="event design" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        height: 140,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0892d0',
        fontSize: 42
      }}
    >
      <CalendarOutlined />
    </div>
  );
};

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 12 },
    search: '',
    status: undefined,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [toggling, setToggling] = useState({});
  const [viewMode, setViewMode] = useState('grid');

  const searchTimeoutRef = useRef(null);

  const fetchEvents = async (params = tableParams) => {
    setLoading(true);
    try {
      const res = await eventsApi.getEvents({
        search: params.search,
        status: params.status,
        page: params.pagination.current,
        per_page: params.pagination.pageSize,
      });
      setEvents(res.data.data);
      setTotal(res.data.total || res.data.meta?.total || 0);
    } catch {
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await listAdminTemplates({ is_active: 1, per_page: 100 });
      setTemplates(res.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [tableParams.pagination.current, tableParams.pagination.pageSize, tableParams.search, tableParams.status]);

  const handleSearch = (e) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setTableParams(prev => ({
        ...prev,
        search: value,
        pagination: { ...prev.pagination, current: 1 },
      }));
    }, 500);
  };

  const handleDelete = async (id) => {
    try {
      await eventsApi.deleteEvent(id);
      message.success('Event deleted');
      fetchEvents();
    } catch {
      message.error('Failed to delete event');
    }
  };

  const handleToggle = async (event) => {
    const eventId = event.hash_id || event.id;
    setToggling(prev => ({ ...prev, [eventId]: true }));
    try {
      await eventsApi.toggleEventStatus(eventId);
      setEvents(prev =>
        prev.map(e => (e.hash_id || e.id) === eventId ? { ...e, is_active: !e.is_active } : e)
      );
      message.success(`Event ${event.is_active ? 'deactivated' : 'activated'}`);
    } catch {
      message.error('Toggle failed');
    } finally {
      setToggling(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'upcoming': return { color: 'processing', text: 'Upcoming', badge: 'blue' };
      case 'ongoing': return { color: 'success', text: 'Ongoing', badge: 'green' };
      case 'completed': return { color: 'default', text: 'Completed', badge: 'gray' };
      case 'cancelled': return { color: 'error', text: 'Cancelled', badge: 'red' };
      default: return { color: 'default', text: status, badge: 'gray' };
    }
  };

  const columns = [
    {
      title: 'Event Name',
      key: 'name',
      render: (_, record) => (
        <Space>
          <div
            style={{
              width: 40, height: 40, borderRadius: 8,
              background: record.is_active ? 'linear-gradient(135deg, #0892d0, #0670a8)' : '#f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: record.is_active ? '#fff' : '#bfbfbf', fontSize: 18, flexShrink: 0,
            }}
          >
            <CalendarOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1f1f1f', fontSize: 15 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
               <EnvironmentOutlined /> {record.location || 'No location set'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Date & Time',
      key: 'event_date',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#262626' }}>
            {dayjs(record.event_date).format('MMM D, YYYY')}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            <ClockCircleOutlined /> {dayjs(record.event_date).format('h:mm A')}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const config = getStatusConfig(record.status);
        return <Tag color={config.color} style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>{config.text}</Tag>;
      },
    },
    {
      title: 'Active',
      key: 'toggle',
      width: 100,
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          loading={toggling[record.hash_id || record.id]}
          onChange={() => handleToggle(record)}
          style={{ backgroundColor: record.is_active ? '#0892d0' : undefined }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Manage Event">
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(`/events/${record.hash_id || record.id}`)}
            >
              Dashboard
            </Button>
          </Tooltip>
          <Tooltip title="Edit Event">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#0892d0' }} />}
              onClick={() => { setEditingEvent(record); setModalVisible(true); }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Event"
            description="Are you sure you want to delete this event?"
            onConfirm={() => handleDelete(record.hash_id || record.id)}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
        background: '#fff', padding: '20px 24px', borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1f1f1f' }}>Event Management</Title>
          <Text type="secondary">Create and manage your upcoming events and activities</Text>
        </div>
        <Space size="middle">
          <Input
            placeholder="Search events..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onChange={handleSearch}
            style={{ width: 260, borderRadius: 8, height: 40 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingEvent(null); setModalVisible(true); }}
            style={{ borderRadius: 8, height: 40, padding: '0 20px', fontWeight: 500 }}
          >
            Create Event
          </Button>
        </Space>
      </div>

      {/* View Toggle & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Tabs 
          activeKey={viewMode} 
          onChange={setViewMode}
          items={[
            { key: 'grid', label: <span><AppstoreOutlined /> Grid View</span> },
            { key: 'list', label: <span><UnorderedListOutlined /> List View</span> }
          ]}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Content Area */}
      {loading ? (
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4].map(i => (
            <Col xs={24} sm={12} md={12} lg={8} xl={6} key={i}>
              <Card style={{ borderRadius: 16 }}>
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : viewMode === 'grid' ? (
        <Row gutter={[24, 24]}>
          {events.map((event) => {
            const config = getStatusConfig(event.status);
            const isPast = dayjs(event.event_date).isBefore(dayjs());
            return (
              <Col xs={24} sm={12} md={12} lg={8} xl={6} key={event.hash_id || event.id}>
                <Card
                  hoverable
                  cover={<EventCardImage event={event} templates={templates} />}
                  bodyStyle={{ padding: '20px' }}
                  style={{ 
                    borderRadius: 16, 
                    overflow: 'hidden',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    opacity: event.is_active ? 1 : 0.6,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  actions={[
                    <Tooltip title="Manage Dashboard"><ArrowRightOutlined key="manage" style={{ color: '#0892d0' }} onClick={() => navigate(`/events/${event.hash_id || event.id}`)} /></Tooltip>,
                    <Tooltip title="Toggle Active Status"><Switch size="small" checked={event.is_active} onChange={() => handleToggle(event)} loading={toggling[event.hash_id || event.id]} style={{ backgroundColor: event.is_active ? '#0892d0' : undefined }} /></Tooltip>,
                    <Tooltip title="Edit Event"><EditOutlined key="edit" style={{ color: '#0892d0' }} onClick={() => { setEditingEvent(event); setModalVisible(true); }} /></Tooltip>,
                    <Popconfirm title="Delete Event?" onConfirm={() => handleDelete(event.hash_id || event.id)}><DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} /></Popconfirm>
                  ]}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Tag color={config.color} style={{ borderRadius: 12, margin: 0, fontWeight: 600 }}>{config.text}</Tag>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8, color: '#1f1f1f' }} ellipsis={{ tooltip: event.name }}>
                      {event.name}
                    </Text>
                    
                    <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', color: isPast ? '#ff4d4f' : '#595959', fontSize: 13, fontWeight: 500 }}>
                        <ClockCircleOutlined style={{ marginRight: 6 }} />
                        {dayjs(event.event_date).format('MMM D, YYYY')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', color: '#8c8c8c', fontSize: 13 }}>
                        <EnvironmentOutlined style={{ marginRight: 6, marginTop: 3 }} />
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {event.location || 'No location specified'}
                        </span>
                      </div>
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none' }}
        >
          <Table
            columns={columns}
            dataSource={events}
            rowKey={(record) => record.hash_id || record.id}
            loading={loading}
            pagination={{
              ...tableParams.pagination,
              total,
              showSizeChanger: true,
              style: { padding: 20 },
            }}
            onChange={(pagination) => setTableParams(prev => ({ ...prev, pagination }))}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}

      <EventModal
        visible={modalVisible}
        event={editingEvent}
        onCancel={() => { setModalVisible(false); setEditingEvent(null); }}
        onSuccess={() => { setModalVisible(false); setEditingEvent(null); fetchEvents(); }}
      />
    </div>
  );
};

export default Events;
