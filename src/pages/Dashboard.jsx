import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Progress, List, Avatar, Tag, Skeleton, Badge, Divider, Select, Grid } from 'antd';
import { 
  CalendarOutlined, 
  TeamOutlined, 
  DollarCircleOutlined, 
  MessageOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  CheckCircleOutlined, 
  ClockCircleOutlined,
  GlobalOutlined,
  UserOutlined,
  FilterOutlined
} from '@ant-design/icons';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const Dashboard = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.lg;
    
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const fetchStats = async (eventId = null) => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/dashboard/stats', {
                params: { event_id: eventId }
            });
            if (res.data) {
                setData(res.data);
            }
        } catch (err) {
            console.error('Dashboard Error:', err);
            setData({ stats: {}, recent_activity: [], events: [], is_admin: false });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(selectedEvent);
    }, [selectedEvent]);

    if (loading || !data) return (
        <div style={{ padding: '24px' }}>
            <Skeleton active paragraph={{ rows: 10 }} />
        </div>
    );

    const stats = {
        total_events: 0,
        active_events: 0,
        total_guests: 0,
        attended_guests: 0,
        total_revenue: 0,
        total_pledges: 0,
        revenue_growth: 0,
        messages_sent: 0,
        ...(data?.stats || {})
    };
    const recent_activity = data?.recent_activity || [];
    const events = data?.events || [];
    const is_admin = data?.is_admin || false;

    const healthPercent = Math.round((stats.total_revenue / (stats.total_pledges || 1)) * 100);

    const StatCard = ({ title, value, icon, color, suffix, subtext }) => (
        <Card 
            style={{ 
                borderRadius: 24, 
                border: 'none', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                background: '#fff'
            }}
            bodyStyle={{ padding: '24px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Text type="secondary" style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 8 }}>{title}</Text>
                    <Statistic 
                        value={value} 
                        suffix={suffix}
                        valueStyle={{ color: '#1f1f1f', fontWeight: 800, fontSize: 28 }}
                    />
                    {subtext && <Text type="secondary" style={{ fontSize: 12 }}>{subtext}</Text>}
                </div>
                <div style={{ 
                    width: 52, 
                    height: 52, 
                    borderRadius: 16, 
                    background: `${color}15`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: color,
                    fontSize: 24
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ 
                height: 4, 
                width: '40%', 
                background: color, 
                marginTop: 20, 
                borderRadius: 2,
                boxShadow: `0 2px 10px ${color}50`
            }} />
        </Card>
    );

    return (
        <div style={{ padding: '24px', maxWidth: 1600, margin: '0 auto' }}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
                        Welcome, {user?.name || 'User'} in KadiYako
                    </Title>
                    <Text type="secondary">Here's what's happening with your events today.</Text>
                </div>
                
                <Space size="middle" direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
                    <Select
                        placeholder="Select Event"
                        style={{ width: 240 }}
                        onChange={setSelectedEvent}
                        value={selectedEvent}
                        suffixIcon={<FilterOutlined />}
                        allowClear
                        onClear={() => setSelectedEvent(null)}
                    >
                        <Option value={null}>Show All Events</Option>
                        {events.map(event => (
                            <Option key={event.id} value={event.id}>{event.name}</Option>
                        ))}
                    </Select>

                    <Badge 
                        status="processing" 
                        text={<Text strong style={{ color: '#0892d0' }}>LIVE MONITORING</Text>} 
                        style={{ background: '#e6f7ff', padding: '8px 16px', borderRadius: 20, border: '1px solid #91d5ff' }}
                    />
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                {/* Main Stats Row */}
                <Col xs={24} sm={12} lg={6}>
                    <StatCard 
                        title="Total Events" 
                        value={stats.total_events} 
                        icon={<CalendarOutlined />} 
                        color="#0892d0" 
                        subtext={`${stats.active_events} events are currently active`}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard 
                        title="Total Guests" 
                        value={stats.total_guests} 
                        icon={<TeamOutlined />} 
                        color="#722ed1" 
                        subtext={`${stats.attended_guests} guests have checked in`}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard 
                        title="Total Collections" 
                        value={stats.total_revenue} 
                        icon={<DollarCircleOutlined />} 
                        color="#52c41a" 
                        suffix="TZS"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard 
                        title="Messages Sent" 
                        value={stats.messages_sent} 
                        icon={<MessageOutlined />} 
                        color="#faad14" 
                    />
                </Col>

                {/* Secondary Row: Insights & Activity */}
                <Col xs={24} lg={16}>
                    <Card 
                        title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><span>Attendance Pulse</span></Space>}
                        style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', height: '100%' }}
                    >
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Progress 
                                type="dashboard" 
                                percent={Math.round((stats.attended_guests / (stats.total_guests || 1)) * 100)} 
                                strokeColor={{
                                    '0%': '#108ee9',
                                    '100%': '#87d068',
                                }}
                                strokeWidth={10}
                                width={200}
                                format={percent => (
                                    <div className="animated-pulse">
                                        <div style={{ fontSize: 36, fontWeight: 800 }}>{percent}%</div>
                                        <div style={{ fontSize: 14, color: '#8c8c8c' }}>Turnout</div>
                                    </div>
                                )}
                            />
                            <div style={{ marginTop: 24 }}>
                                <Row gutter={16} justify="center">
                                    <Col>
                                        <Badge color="#52c41a" text={`Arrived: ${stats.attended_guests}`} />
                                    </Col>
                                    <Col>
                                        <Badge color="#d9d9d9" text={`Pending: ${stats.total_guests - stats.attended_guests}`} />
                                    </Col>
                                </Row>
                            </div>
                        </div>
                        <Divider />
                        <div style={{ padding: '0 20px 20px' }}>
                            <Title level={5} style={{ marginBottom: 16 }}>Revenue Health</Title>
                            <Progress 
                                percent={healthPercent} 
                                status="active" 
                                strokeColor="#52c41a" 
                                showInfo={false}
                                style={{ marginBottom: 8 }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Target vs. Actual</Text>
                                <Text strong style={{ color: stats.revenue_growth >= 0 ? '#52c41a' : '#ff4d4f' }}>
                                    {stats.revenue_growth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} 
                                    {Math.abs(stats.revenue_growth)}% {stats.revenue_growth >= 0 ? 'increase' : 'decrease'}
                                </Text>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card 
                        title={<Space><ClockCircleOutlined style={{ color: '#0892d0' }} /><span>Live Activity Feed</span></Space>}
                        style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', height: '100%' }}
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={recent_activity}
                            renderItem={(item, index) => (
                                <List.Item style={{ borderBottom: index === recent_activity.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar style={{ backgroundColor: '#f0f5ff', color: '#0892d0' }} icon={<UserOutlined />} />
                                        }
                                        title={<Text strong>{item.guest}</Text>}
                                        description={
                                            <Space direction="vertical" size={0}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Checked into {item.event}</Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.time).fromNow()}</Text>
                                            </Space>
                                        }
                                    />
                                    <Tag color="success" style={{ borderRadius: 10 }}>CHECK-IN</Tag>
                                </List.Item>
                            )}
                            locale={{ emptyText: <div style={{ padding: '40px 0' }}><Text type="secondary">No recent check-ins detected.</Text></div> }}
                        />
                    </Card>
                </Col>
            </Row>

            <style>{`
                .animated-pulse {
                    animation: softPulse 2s infinite ease-in-out;
                }
                @keyframes softPulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .ant-statistic-title {
                    margin-bottom: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
