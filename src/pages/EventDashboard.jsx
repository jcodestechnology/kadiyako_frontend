import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Typography, Button, Space, message, Spin,
  Row, Col, Select, Tag, Table, InputNumber, Popconfirm, Modal, Empty, Skeleton, Upload, Progress
} from 'antd';
import {
  ArrowLeftOutlined, UserAddOutlined, SaveOutlined, DownloadOutlined, IdcardOutlined, 
  PictureOutlined, EyeOutlined, ExportOutlined, ImportOutlined, UploadOutlined
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import eventsApi from '../api/eventsApi';
import { listAdminTemplates, fetchAsBlob } from '../api/templatesApi';
import axiosInstance from '../api/axios';

const { Title, Text } = Typography;

const EventDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [guests, setGuests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPledge, setGroupPledge] = useState(0);
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewGuest, setPreviewGuest] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [groupContacts, setGroupContacts] = useState([]);
  const [cardType, setCardType] = useState('SINGLE');

  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  const [cardModalVisible, setCardModalVisible] = useState(false);

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

  const fetchTemplates = async () => {
    try {
      const res = await listAdminTemplates({ is_active: 1, per_page: 100 });
      setTemplates(res.data || []);
    } catch (e) {}
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
      await Promise.all([fetchEvent(), fetchGuests(), fetchTemplates(), fetchGroups()]);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleTemplateChange = async (templateId) => {
    try {
      await eventsApi.updateEvent(id, { template_id: templateId });
      setEvent(prev => ({ ...prev, template_id: templateId }));
      message.success('Template updated for this event');
    } catch (e) {
      message.error('Failed to update template');
    }
  };

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const loadTemplateImage = async () => {
      if (event?.template_id && templates && templates.length > 0) {
        const template = templates.find(t => (t.id == event.template_id));
        if (template) {
          const targetUrl = template.preview_url || template.file_url;
          if (targetUrl) {
            setLoadingImage(true);
            try {
              const blob = await fetchAsBlob(targetUrl);
              if (!isMounted) return;
              objectUrl = URL.createObjectURL(blob);
              setImageUrl(objectUrl);
            } catch (err) {
              console.error('Failed to load template image', err);
            } finally {
              if (isMounted) setLoadingImage(false);
            }
          }
        }
      }
    };
    loadTemplateImage();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [event?.template_id, templates]);

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

  const renderCardPreview = () => {
    if (!event || !event.template_id) return <Empty description="No template selected for this event." />;
    if (!previewGuest) return null;

    const template = templates.find(t => t.id == event.template_id);
    if (!template) return <Empty description="Template not found." />;

    let config = {
      guest_name: { x: 50, y: 40, fontSize: 24, color: '#000000', fontFamily: 'Arial' },
      card_type: { x: 50, y: 60, fontSize: 14, color: '#000000', fontFamily: 'Arial' },
      qr_code: { x: 50, y: 85, size: 100 }
    };
    
    try {
      if (template.placeholders && template.placeholders.length > 0 && typeof template.placeholders[0] === 'string') {
        config = JSON.parse(template.placeholders[0]);
      } else if (template.placeholders && typeof template.placeholders === 'object' && !Array.isArray(template.placeholders)) {
        // If it was already parsed by Laravel (unlikely given the [0] structure but safe)
        config = template.placeholders;
      }
    } catch (e) {
      console.error('Placeholder parse error:', e);
    }

    // Smart Card Number: EV-GU-ID
    const evPrefix = event.name.substring(0, 2).toUpperCase();
    const guPrefix = (previewGuest.contact?.first_name || 'GU').substring(0, 2).toUpperCase();
    const cardNumber = `${evPrefix}-${guPrefix}-${previewGuest.id || '000'}`;
    
    return (
      <div id="card-preview" style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: 500, 
        margin: '0 auto', 
        borderRadius: 12, 
        overflow: 'hidden', 
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        background: '#fff'
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt="Card Template" style={{ width: '100%', display: 'block' }} />
        ) : (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Spin tip="Preparing Canvas..." />
          </div>
        )}
        
        {/* Guest Name */}
        <div style={{ 
          position: 'absolute', 
          top: `${config.guest_name.y}%`, 
          left: `${config.guest_name.x}%`, 
          color: config.guest_name.color, 
          fontSize: config.guest_name.fontSize, 
          fontFamily: config.guest_name.fontFamily, 
          fontWeight: 'bold', 
          transform: 'translate(-50%, -50%)', 
          whiteSpace: 'nowrap',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          {previewGuest.contact?.first_name} {previewGuest.contact?.last_name}
        </div>

        {/* Card Type */}
        <div style={{ 
          position: 'absolute', 
          top: `${config.card_type.y}%`, 
          left: `${config.card_type.x}%`, 
          color: config.card_type.color, 
          fontSize: config.card_type.fontSize, 
          fontFamily: config.card_type.fontFamily, 
          transform: 'translate(-50%, -50%)', 
          whiteSpace: 'nowrap',
          fontWeight: 500,
          background: 'rgba(255,255,255,0.2)',
          padding: '2px 8px',
          borderRadius: 4
        }}>
          {cardType} CARD
        </div>

        {/* QR Code Section - Number only inside QR */}
        <div style={{ 
          position: 'absolute', 
          top: `${config.qr_code.y}%`, 
          left: `${config.qr_code.x}%`, 
          transform: 'translate(-50%, -50%)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}>
          <div style={{ 
            width: config.qr_code.size, 
            height: config.qr_code.size, 
            background: '#fff', 
            padding: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <QRCodeSVG value={cardNumber} size={config.qr_code.size - 16} />
          </div>
        </div>
      </div>
    );
  };

  const handleGenerateAndSaveCard = async () => {
    const totalPaid = parseFloat(previewGuest.payments_sum_amount || previewGuest.paid_amount || 0);
    const balance = parseFloat(previewGuest.pledge_amount || 0) - totalPaid;

    const proceed = async () => {
      const element = document.getElementById('card-preview');
      if (!element) return;
      
      const hide = message.loading('Generating and saving card...', 0);
      try {
        const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
        
        const evPrefix = event.name.substring(0, 2).toUpperCase();
        const guPrefix = (previewGuest.contact?.first_name || 'GU').substring(0, 2).toUpperCase();
        const cardNumber = `${evPrefix}-${guPrefix}-${previewGuest.id || '000'}`;

        canvas.toBlob(async (blob) => {
          const formData = new FormData();
          formData.append('card_image', blob, `card_${previewGuest.hash_id}.png`);
          formData.append('card_number', cardNumber);

          try {
            await axiosInstance.post(`/events/${id}/guests/${previewGuest.hash_id || previewGuest.id}/store-card`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            message.success('Card generated and saved successfully!');
            setCardModalVisible(false);
            fetchGuests(); // Refresh to show "Created" status
          } catch (err) {
            message.error('Failed to save card to server.');
          } finally {
            hide();
          }
        }, 'image/png');

      } catch (e) {
        hide();
        message.error('Generation failed.');
      }
    };

    if (balance > 0) {
      Modal.confirm({
        title: 'Outstanding Balance Detected',
        content: `This guest still has an unpaid balance of TZS ${balance.toLocaleString()}. Are you sure you want to generate their card anyway?`,
        okText: 'Generate Anyway',
        cancelText: 'Cancel',
        onOk: proceed
      });
    } else {
      proceed();
    }
  };

  const guestColumns = [
    {
      title: 'Guest',
      key: 'name',
      render: (_, r) => <Text strong>{r.contact?.first_name} {r.contact?.last_name}</Text>
    },
    {
      title: 'Card Status',
      dataIndex: 'card_status',
      key: 'card_status',
      render: (v) => v === 'created' 
        ? <Tag color="success">Created</Tag> 
        : <Tag color="default">Not Created</Tag>
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
          <Button type="primary" ghost icon={<IdcardOutlined />} onClick={() => { setPreviewGuest(r); setCardModalVisible(true); }}>Card</Button>
          <Popconfirm title="Remove guest?" onConfirm={() => handleDeleteGuest(r.hash_id || r.id)}>
            <Button danger icon={<ArrowLeftOutlined style={{ rotate: '135deg' }} />}></Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!event) return null;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/events')} />
        <div>
          <Title level={3} style={{ margin: 0 }}>{event.name}</Title>
          <Text type="secondary">Manage your event details, guests, pledges, and digital cards.</Text>
        </div>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: 0 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          style={{ padding: '0 24px' }}
          items={[
            {
              key: 'overview',
              label: 'Overview & Template',
              children: (
                <div style={{ padding: '24px 0' }}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Title level={5}>Event Details</Title>
                      <p><strong>Location:</strong> {event.location || 'N/A'}</p>
                      <p><strong>Date:</strong> {event.event_date}</p>
                      <p><strong>Description:</strong> {event.description}</p>
                    </Col>
                    <Col xs={24} md={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={5} style={{ margin: 0 }}>Card Template Selection</Title>
                        <Button 
                          type="primary" 
                          icon={<PictureOutlined />} 
                          onClick={() => navigate('/templates', { state: { eventId: id } })}
                        >
                          Template Gallery
                        </Button>
                      </div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                        Select the template to be used for generating digital cards for your guests.
                      </Text>
                      
                      {event.template_id ? (
                        <Card 
                          size="small" 
                          styles={{ body: { padding: 12 } }}
                          style={{ borderRadius: 12, border: '1px solid #f0f0f0', background: '#f9f9f9' }}
                        >
                          <Row gutter={16} align="middle">
                            <Col span={8}>
                              {loadingImage ? (
                                <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', borderRadius: 8 }}>
                                  <Spin />
                                </div>
                              ) : imageUrl ? (
                                <img src={imageUrl} alt="Selected Template" style={{ width: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                              ) : (
                                <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8, color: '#bfbfbf' }}>
                                  <PictureOutlined style={{ fontSize: 32 }} />
                                </div>
                              )}
                            </Col>
                            <Col span={16}>
                              <Text strong style={{ fontSize: 16, display: 'block' }}>
                                {templates.find(t => t.id == event.template_id)?.name || 'Selected Template'}
                              </Text>
                              <Tag color="green" style={{ marginTop: 8 }}>Active for this Event</Tag>
                              <Button 
                                block 
                                style={{ marginTop: 12 }} 
                                onClick={() => navigate('/templates', { state: { eventId: id } })}
                              >
                                Change Design
                              </Button>
                            </Col>
                          </Row>
                        </Card>
                      ) : (
                        <Empty 
                          description="No template selected" 
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                          <Button type="primary" onClick={() => navigate('/templates', { state: { eventId: id } })}>
                            Browse Templates
                          </Button>
                        </Empty>
                      )}
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'guests',
              label: 'Guests & Contributions',
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
              key: 'card',
              label: 'Smart Card Generator',
              children: (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  {renderCardPreview()}
                  {previewGuest && event?.template_id && (
                    <Space style={{ marginTop: 24 }}>
                      <Select value={cardType} onChange={setCardType} options={[{label:'SINGLE', value:'SINGLE'}, {label:'DOUBLE', value:'DOUBLE'}]} style={{ width: 120 }} size="large" />
                      <Button type="primary" icon={<SaveOutlined />} size="large" onClick={handleGenerateAndSaveCard}>
                        {previewGuest?.card_status === 'created' ? 'Re-generate & Save' : 'Generate & Save Card'}
                      </Button>
                    </Space>
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

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

      <Modal
        title={null}
        open={cardModalVisible}
        onCancel={() => setCardModalVisible(false)}
        footer={null}
        width={600}
        centered
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: 24, background: '#f0f2f5', borderRadius: '12px 12px 0 0' }}>
          <Title level={4} style={{ margin: 0 }}>Digital Card Preview</Title>
          <Text type="secondary">Generated for {previewGuest?.contact?.first_name} {previewGuest?.contact?.last_name}</Text>
        </div>
        <div style={{ padding: 24 }}>
          {renderCardPreview()}
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', padding: 16, borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text strong>Card Type:</Text>
              <Select 
                value={cardType} 
                onChange={setCardType} 
                options={[{label:'SINGLE', value:'SINGLE'}, {label:'DOUBLE', value:'DOUBLE'}]} 
                style={{ width: 120 }} 
              />
            </div>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              size="large" 
              onClick={handleGenerateAndSaveCard}
              style={{ borderRadius: 8 }}
            >
              {previewGuest?.card_status === 'created' ? 'Re-generate & Save' : 'Generate & Save Card'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventDashboard;
