import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Typography, Button, Space, message, Spin,
  Row, Col, Select, Tag, Table, InputNumber, Popconfirm, Modal, Empty, Upload, Progress, Form, Input, Badge
} from 'antd';
import {
  ArrowLeftOutlined, UserAddOutlined, SaveOutlined, ExportOutlined, ImportOutlined, UploadOutlined, SettingOutlined, DeleteOutlined
} from '@ant-design/icons';
import eventsApi from '../api/eventsApi';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const EventDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles?.some(r => r.slug === 'super-admin' || r.slug === 'admin');
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPledge, setGroupPledge] = useState(0);
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [groupContacts, setGroupContacts] = useState([]);

  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [uploadForm] = Form.useForm();

  const fetchEvent = async () => {
    try {
      const res = await eventsApi.getEvent(id);
      setEvent(res.data.data);
    } catch (e) {
      message.error('Failed to load event details');
      navigate('/events');
    }
  };

  const fetchGuests = async () => {
    try {
      // Assuming a custom api method or raw axios call
      const res = await axiosInstance.get(`/events/${id}/guests`, { params: { per_page: 100 } });
      setGuests(res.data.data || res.data);
    } catch (e) {
      message.error('Failed to load guests');
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get('/contact-groups');
      setGroups(res.data.data || res.data);
    } catch (e) {}
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEvent(), fetchGuests(), fetchGroups()]);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const openImportModal = async () => {
    if (!selectedGroup) return message.warning('Select a group first');
    try {
      const res = await axiosInstance.get(`/contact-groups/${selectedGroup}/members`, { params: { per_page: 500 } });
      const contacts = res.data.data || res.data;
      setGroupContacts(contacts.map(c => ({ ...c, pledge_amount: groupPledge })));
      setImportModalVisible(true);
    } catch (e) {
      message.error('Failed to load group members');
    }
  };

  const handleBatchImport = async () => {
    setImporting(true);
    try {
      const guestsData = groupContacts.map(c => ({ contact_id: c.id || c.hash_id, pledge_amount: c.pledge_amount || 0 }));
      const res = await axiosInstance.post(`/events/${id}/guests/batch`, { guests: guestsData });
      message.success(res.data.message || 'Guests imported successfully');
      fetchGuests();
      setImportModalVisible(false);
      setSelectedGroup(null);
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to import guests');
    } finally {
      setImporting(false);
    }
  };

  const [updatingGuestId, setUpdatingGuestId] = useState(null);

  const handleGuestUpdate = async (guestId, field, value) => {
    if (!value && field === 'payment_amount') return;
    setUpdatingGuestId(guestId);
    try {
      await axiosInstance.put(`/events/${id}/guests/${guestId}`, { [field]: value });
      message.success('Updated successfully');
      await fetchGuests(); // Refresh to recalculate
    } catch (e) {
      message.error('Failed to update');
    } finally {
      setUpdatingGuestId(null);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axiosInstance.get(`/events/${id}/guests/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.name}_contributions.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Export successful');
    } catch (e) {
      message.error('Failed to export contributions');
    } finally {
      setExporting(false);
    }
  };

  const handleImportGuests = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setIsImporting(true);
    setImportProgress(0);
    setImportStatus('Uploading file...');
    
    try {
      const response = await axiosInstance.post(`/events/${id}/guests/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setImportProgress(percentCompleted);
          if (percentCompleted === 100) {
            setImportStatus('Queued for processing...');
          }
        }
      });
      
      const { jobId } = response.data;
      if (jobId) {
        // Start polling for worker progress
        const pollProgress = async () => {
          try {
            const res = await axiosInstance.get(`/jobs/${jobId}/progress`);
            const { status, percent, processed, total } = res.data;
            
            if (status === 'processing') {
              setImportProgress(percent);
              setImportStatus(`Processing: ${processed} / ${total} guests...`);
              setTimeout(pollProgress, 1500); // Poll every 1.5s
            } else if (status === 'completed') {
              setImportProgress(100);
              setImportStatus('Import completed successfully!');
              message.success('All contributions updated!');
              fetchGuests(); // Refresh the list
              setTimeout(() => setIsImporting(false), 2000);
            } else if (status === 'failed') {
              setIsImporting(false);
              message.error('Background processing failed.');
            } else {
              // Still pending or unknown, keep polling
              setTimeout(pollProgress, 1500);
            }
          } catch (e) {
            setIsImporting(false);
          }
        };
        setTimeout(pollProgress, 1000);
      } else {
        message.success('Import started!');
        setTimeout(() => setIsImporting(false), 1000);
      }
      return false;
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to start import');
      setIsImporting(false);
      return false;
    }
  };

  const handleDeleteGuest = async (guestId) => {
    try {
      await axiosInstance.delete(`/events/${id}/guests/${guestId}`);
      message.success('Guest removed');
      fetchGuests();
    } catch (e) {
      message.error('Failed to remove guest');
    }
  };

  const handleCustomCardUpload = async (values) => {
    const file = values.custom_card_file?.[0]?.originFileObj;
    if (!file) return message.error('Please select an image file');

    const formData = new FormData();
    formData.append('category', values.category);
    formData.append('custom_card_file', file);

    setUploadingDesign(true);
    try {
      await eventsApi.uploadDesign(id, formData);
      message.success('Custom design uploaded successfully');
      setUploadModalVisible(false);
      uploadForm.resetFields();
      fetchEvent();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to upload custom design');
    } finally {
      setUploadingDesign(false);
    }
  };

  const handleDeleteDesign = async (designId) => {
    try {
      await eventsApi.deleteDesign(id, designId);
      message.success('Design deleted successfully');
      fetchEvent();
    } catch (e) {
      message.error('Failed to delete design');
    }
  };

  const handleEventImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('event_image', file);
    try {
      await eventsApi.uploadEventImage(id, formData);
      message.success('Event cover image updated successfully');
      fetchEvent();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to upload cover image');
    }
    return false;
  };

  const guestColumns = [
    {
      title: 'Guest',
      key: 'name',
      render: (_, r) => <Text strong>{r.contact?.first_name} {r.contact?.last_name}</Text>
    },
    {
      title: 'Ahadi (TZS)',
      key: 'pledge_amount',
      render: (_, r) => (
        <InputNumber 
          defaultValue={r.pledge_amount} 
          onBlur={(e) => handleGuestUpdate(r.hash_id || r.id, 'pledge_amount', e.target.value)}
          prefix="TZS"
          style={{ width: 140, borderRadius: 6 }}
          disabled={updatingGuestId === (r.hash_id || r.id)}
        />
      )
    },
    {
      title: 'Total Paid',
      key: 'paid_amount',
      render: (_, r) => {
        const val = r.payments_sum_amount !== null && r.payments_sum_amount !== undefined ? r.payments_sum_amount : r.paid_amount;
        const totalPaid = parseFloat(val) || 0;
        if (totalPaid === 0) return <Text type="secondary">-</Text>;
        return <Text strong style={{ color: '#52c41a' }}>TZS {totalPaid.toLocaleString()}</Text>;
      }
    },
    {
      title: 'Balance',
      key: 'balance',
      render: (_, r) => {
        const val = r.payments_sum_amount !== null && r.payments_sum_amount !== undefined ? r.payments_sum_amount : r.paid_amount;
        const totalPaid = parseFloat(val) || 0;
        const bal = (parseFloat(r.pledge_amount) || 0) - totalPaid;
        if (bal <= 0) return <Text strong style={{ color: '#52c41a' }}>CLEARED</Text>;
        return <Text strong type="danger">TZS {bal.toLocaleString()}</Text>;
      }
    },
    {
      title: 'Reduce Debt',
      key: 'add_payment',
      render: (_, r) => (
        <Space.Compact style={{ width: 180 }}>
          <InputNumber 
            placeholder="Amount..." 
            style={{ width: 120 }} 
            disabled={updatingGuestId === (r.hash_id || r.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGuestUpdate(r.hash_id || r.id, 'payment_amount', e.target.value);
                e.target.value = '';
              }
            }}
          />
          <Button 
            type="primary" 
            loading={updatingGuestId === (r.hash_id || r.id)}
            icon={!updatingGuestId && <SaveOutlined />} 
            onClick={(e) => {
              const input = e.currentTarget.parentElement.querySelector('input');
              if (input && input.value) {
                handleGuestUpdate(r.hash_id || r.id, 'payment_amount', input.value);
                input.value = '';
              }
            }}
          />
        </Space.Compact>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Popconfirm title="Remove guest?" onConfirm={() => handleDeleteGuest(r.hash_id || r.id)}>
            <Button danger icon={<ArrowLeftOutlined style={{ rotate: '135deg' }} />}></Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const attendanceColumns = [
    {
      title: 'Guest Name',
      key: 'name',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.contact?.first_name} {r.contact?.last_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.contact?.phone}</Text>
        </Space>
      )
    },
    {
      title: 'Entry Status',
      key: 'is_attended',
      filters: [
        { text: 'Arrived', value: true },
        { text: 'Pending', value: false },
      ],
      onFilter: (value, record) => !!record.is_attended === value,
      render: (_, r) => (
        r.is_attended ? 
          <Tag color="success" style={{ borderRadius: 12, padding: '2px 12px', fontWeight: 600 }}>ARRIVED</Tag> : 
          <Tag color="default" style={{ borderRadius: 12, padding: '2px 12px' }}>PENDING</Tag>
      )
    },
    {
      title: 'Check-in Time',
      dataIndex: 'attended_at',
      key: 'attended_at',
      sorter: (a, b) => dayjs(a.attended_at || 0).unix() - dayjs(b.attended_at || 0).unix(),
      render: (val) => val ? dayjs(val).format('MMM DD, HH:mm:ss') : <Text type="secondary">-</Text>
    }
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!event) return null;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/events')} />
          <div>
            <Title level={3} style={{ margin: 0 }}>{event.name}</Title>
            <Text type="secondary">Manage your event details, guests, pledges, and digital cards.</Text>
          </div>
        </div>
        
        {event.design_status === 'pending' && !isAdmin && (
          <Tag color="warning" style={{ padding: '8px 16px', fontSize: 14, borderRadius: 8 }}>
            Status: Pending Design from Admin
          </Tag>
        )}
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: 0 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          style={{ padding: '0 24px' }}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <div style={{ padding: '24px 0' }}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Title level={5}>Event Details</Title>
                      <p><strong>Location:</strong> {event.location || 'N/A'}</p>
                      <p><strong>Date:</strong> {event.event_date}</p>
                      <p><strong>Description:</strong> {event.description}</p>
                      
                      <div style={{ marginTop: 20, marginBottom: 20 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Event Cover Image</Text>
                        {event.image_url ? (
                          <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9', marginBottom: 8 }}>
                            <img src={event.image_url} alt="Event Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: 120, background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', marginBottom: 8 }}>
                            No cover image uploaded
                          </div>
                        )}
                        <Upload
                          accept="image/*"
                          showUploadList={false}
                          beforeUpload={handleEventImageUpload}
                        >
                          <Button icon={<UploadOutlined />}>
                            {event.image_url ? 'Change Cover Image' : 'Upload Cover Image'}
                          </Button>
                        </Upload>
                      </div>
                      
                      <div style={{ marginTop: 24, padding: '20px', background: '#f0f5ff', borderRadius: 16, border: '1px solid #adc6ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Title level={5} style={{ margin: 0, color: '#003a8c' }}>Live Attendance Counter</Title>
                          <Badge 
                            count={`${event.attended_guests || 0} / ${event.total_guests || 0}`} 
                            style={{ backgroundColor: '#0892d0', fontSize: 14, padding: '0 12px', height: 28, lineHeight: '28px', borderRadius: 14 }} 
                          />
                        </div>
                        <Progress 
                          percent={Math.round(((event.attended_guests || 0) / (event.total_guests || 1)) * 100)} 
                          status="active" 
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                          strokeWidth={12}
                        />
                        <div style={{ marginTop: 8, textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {Math.round(((event.attended_guests || 0) / (event.total_guests || 1)) * 100)}% of guests have arrived.
                          </Text>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={5} style={{ margin: 0 }}>Uploaded Designs</Title>
                        {isAdmin && (
                          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
                            Upload Design
                          </Button>
                        )}
                      </div>
                      
                      {event.designs && event.designs.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {event.designs.map(design => (
                            <Card key={design.id} size="small" style={{ borderRadius: 8, background: '#f9f9f9' }}>
                              <Row align="middle" justify="space-between">
                                <Col>
                                  <Text strong style={{ display: 'block' }}>{design.category}</Text>
                                </Col>
                                <Col>
                                  <Space>
                                    <Button 
                                      type="primary" 
                                      ghost 
                                      icon={<SettingOutlined />} 
                                      onClick={() => navigate(`/events/${id}/studio`, { state: { designId: design.id } })}
                                    >
                                      Configure
                                    </Button>
                                    {isAdmin && (
                                      <Popconfirm title="Delete this design?" onConfirm={() => handleDeleteDesign(design.id)}>
                                        <Button danger icon={<DeleteOutlined />} />
                                      </Popconfirm>
                                    )}
                                  </Space>
                                </Col>
                              </Row>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Empty description="No designs uploaded for this event." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </Col>
                    
                    {event.card_requirements && (
                      <Col span={24} style={{ marginTop: 24 }}>
                        <Card size="small" title="Design Requirements" style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
                          <Text>{event.card_requirements}</Text>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </div>
              )
            },
            {
              key: 'guests',
              label: 'Contributions and Guests',
              children: (
                <div style={{ padding: '24px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16, background: '#fafafa', padding: 16, borderRadius: 8 }}>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>Import Contact Group</Title>
                      <Text type="secondary">Quickly add multiple guests and set their default expected contribution (Ahadi).</Text>
                    </div>
                    <Space wrap>
                      <Select 
                        placeholder="Select Group" 
                        style={{ width: 200 }} 
                        value={selectedGroup}
                        onChange={setSelectedGroup}
                        options={groups.map(g => ({ label: g.name, value: g.hash_id || g.id }))}
                      />
                      <InputNumber 
                        placeholder="Default Pledge" 
                        style={{ width: 150 }} 
                        value={groupPledge}
                        onChange={setGroupPledge}
                        prefix="TZS"
                      />
                      <Button 
                        type="primary" 
                        icon={<UserAddOutlined />} 
                        onClick={openImportModal}
                        loading={importing}
                      >
                        Import Group
                      </Button>

                      <div style={{ borderLeft: '1px solid #d9d9d9', height: 32, margin: '0 8px' }} />
                      
                      <Button 
                        icon={<ExportOutlined />} 
                        onClick={handleExport}
                        loading={exporting}
                      >
                        Export Excel
                      </Button>

                      <Upload 
                        beforeUpload={handleImportGuests} 
                        showUploadList={false}
                        accept=".xlsx,.xls,.csv"
                      >
                        <Button icon={<ImportOutlined />}>Import Excel</Button>
                      </Upload>
                    </Space>
                  </div>
                  
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                      <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                        <Text type="secondary">Total Pledges</Text>
                        <Title level={4} style={{ margin: 0 }}>
                          TZS {guests.reduce((acc, g) => acc + (parseFloat(g.pledge_amount) || 0), 0).toLocaleString()}
                        </Title>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Text type="secondary">Total Collected</Text>
                        <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                          TZS {guests.reduce((acc, g) => {
                            const val = g.payments_sum_amount !== null && g.payments_sum_amount !== undefined ? g.payments_sum_amount : g.paid_amount;
                            const paid = parseFloat(val) || 0;
                            return acc + paid;
                          }, 0).toLocaleString()}
                        </Title>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small" style={{ background: '#fff2f0', border: '1px solid #ffccc7' }}>
                        <Text type="secondary">Outstanding Balance</Text>
                        <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                          TZS {guests.reduce((acc, g) => {
                            const pledge = parseFloat(g.pledge_amount) || 0;
                            const val = g.payments_sum_amount !== null && g.payments_sum_amount !== undefined ? g.payments_sum_amount : g.paid_amount;
                            const paid = parseFloat(val) || 0;
                            const bal = pledge - paid;
                            return acc + (bal > 0 ? bal : 0);
                          }, 0).toLocaleString()}
                        </Title>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Table 
                    columns={guestColumns} 
                    dataSource={guests} 
                    rowKey={(r) => r.hash_id || r.id}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }}
                  />
                </div>
              )
            },
            {
              key: 'attendance',
              label: 'Attendance Tracking',
              children: (
                <div style={{ padding: '24px 0' }}>
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #52c41a' }}>
                        <Text type="secondary">Guests Arrived</Text>
                        <Title level={3} style={{ margin: 0 }}>{event.attended_guests || 0}</Title>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #faad14' }}>
                        <Text type="secondary">Pending Arrival</Text>
                        <Title level={3} style={{ margin: 0 }}>{(event.total_guests || 0) - (event.attended_guests || 0)}</Title>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #1890ff' }}>
                        <Text type="secondary">Attendance Rate</Text>
                        <Title level={3} style={{ margin: 0 }}>
                          {Math.round(((event.attended_guests || 0) / (event.total_guests || 1)) * 100)}%
                        </Title>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Table 
                    columns={attendanceColumns} 
                    dataSource={guests} 
                    rowKey={(r) => r.hash_id || r.id}
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: 'max-content' }}
                    style={{ background: '#fff', borderRadius: 8 }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title="Upload Event Design"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleCustomCardUpload}>
          <Form.Item name="category" label="Category Name" rules={[{ required: true, message: 'Please enter category (e.g. Mchango)' }]}>
            <Input placeholder="e.g. Mchango" size="large" />
          </Form.Item>
          <Form.Item name="custom_card_file" label="Design Image" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList} rules={[{ required: true, message: 'Image required' }]}>
            <Upload beforeUpload={() => false} maxCount={1} listType="picture" accept="image/*">
              <Button icon={<UploadOutlined />}>Select Image File</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={uploadingDesign} block size="large">
            Upload Design
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Confirm Guest Import & Adjust Pledges"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onOk={handleBatchImport}
        confirmLoading={importing}
        width={700}
        okText="Confirm Import"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Review the list of contacts being imported. You can adjust the Ahadi (Pledge Amount) for each person individually before confirming.
        </Text>
        <Table 
          dataSource={groupContacts}
          rowKey={(r) => r.id || r.hash_id}
          pagination={{ pageSize: 5 }}
          size="small"
          columns={[
            { title: 'Name', render: (_, r) => `${r.first_name} ${r.last_name}` },
            { title: 'Phone', dataIndex: 'phone' },
            { 
              title: 'Ahadi (TZS)', 
              render: (_, r, idx) => (
                <InputNumber 
                  value={r.pledge_amount} 
                  onChange={(v) => {
                    const newContacts = [...groupContacts];
                    newContacts[idx].pledge_amount = v;
                    setGroupContacts(newContacts);
                  }}
                  style={{ width: '100%' }}
                />
              )
            }
          ]}
        />
      </Modal>

      <Modal
        title="Importing Contributions"
        open={isImporting}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Progress 
            type="circle" 
            percent={importProgress} 
            status={importProgress === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div style={{ marginTop: 20 }}>
            <Text strong>{importStatus}</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Please wait while we sync your contributions...</Text>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default EventDashboard;
