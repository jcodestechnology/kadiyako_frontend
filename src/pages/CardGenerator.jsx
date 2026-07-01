import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Table, Button, Space, Modal, Spin, message, Row, Col, Empty } from 'antd';
import { IdcardOutlined, DownloadOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import eventsApi from '../api/eventsApi';
import axiosInstance from '../api/axios';
import { fetchAsBlob } from '../api/templatesApi';

const { Title, Text } = Typography;

const CardGenerator = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  
  const [guests, setGuests] = useState([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  
  const [previewGuest, setPreviewGuest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const [previewGeneratedCard, setPreviewGeneratedCard] = useState(null);
  const [cardType, setCardType] = useState('SINGLE');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await eventsApi.getEvents({ per_page: 100 });
        setEvents(res.data?.data || res.data || []);
      } catch (e) {
        message.error('Failed to load events');
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setGuests([]);
      setEventDetails(null);
      return;
    }

    const loadEventData = async () => {
      setLoadingGuests(true);
      try {
        const [eventRes, guestsRes] = await Promise.all([
          eventsApi.getEvent(selectedEventId),
          axiosInstance.get(`/events/${selectedEventId}/guests`, { params: { per_page: 500 } })
        ]);
        
        setEventDetails(eventRes.data.data);
        setGuests(guestsRes.data.data || guestsRes.data);
      } catch (e) {
        message.error('Failed to load event data');
      } finally {
        setLoadingGuests(false);
      }
    };

    loadEventData();
  }, [selectedEventId]);

  const refreshGuests = async () => {
    try {
      const res = await axiosInstance.get(`/events/${selectedEventId}/guests`, { params: { per_page: 500 } });
      setGuests(res.data.data || res.data);
    } catch (e) {}
  };

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const loadDesignImage = async () => {
      if (!selectedDesignId || !eventDetails) {
        setImageUrl(null);
        return;
      }

      const design = eventDetails.designs?.find(d => d.id === selectedDesignId);
      if (!design || !design.card_url) return;

      setLoadingImage(true);
      try {
        const blob = await fetchAsBlob(design.card_url);
        if (!isMounted) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        if (isMounted) setImageUrl('error');
        message.error('Failed to load design image');
      } finally {
        if (isMounted) setLoadingImage(false);
      }
    };

    loadDesignImage();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedDesignId, eventDetails]);

  const handleOpenGenerator = (guest) => {
    setPreviewGuest(guest);
    
    if (eventDetails?.designs && eventDetails.designs.length > 0) {
      setSelectedDesignId(eventDetails.designs[0].id);
    } else {
      setSelectedDesignId(null);
    }
    
    setModalVisible(true);
  };

  const handleGenerateAndSave = async () => {
    const element = document.getElementById('card-preview');
    if (!element) return;
    
    const hide = message.loading('Generating and saving card...', 0);
    try {
      const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
      
      const evPrefix = eventDetails.name.substring(0, 2).toUpperCase();
      const guPrefix = (previewGuest.contact?.first_name || 'GU').substring(0, 2).toUpperCase();
      const cardNumber = `${evPrefix}-${guPrefix}-${previewGuest.id || '000'}`;

      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('card_image', blob, `card_${previewGuest.hash_id}.png`);
        formData.append('card_number', cardNumber);

        try {
          await axiosInstance.post(`/events/${selectedEventId}/guests/${previewGuest.hash_id || previewGuest.id}/store-card`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          message.success('Card generated and saved successfully!');
          setModalVisible(false);
          refreshGuests();
        } catch (err) {
          message.error('Failed to save card to server.');
        } finally {
          hide();
        }
      }, 'image/png');

    } catch (e) {
      hide();
      message.error('Failed to generate card');
    }
  };

  const columns = [
    {
      title: 'Guest Name',
      key: 'name',
      render: (_, r) => <Text strong>{r.contact?.first_name} {r.contact?.last_name}</Text>
    },
    {
      title: 'Phone',
      key: 'phone',
      render: (_, r) => r.contact?.phone
    },
    {
      title: 'Card Status',
      key: 'card_status',
      render: (_, r) => r.card_status === 'created' 
        ? <Typography.Text type="success" strong>Generated</Typography.Text> 
        : <Typography.Text type="secondary">Pending</Typography.Text>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button 
            type="primary" 
            ghost={r.card_status === 'created'}
            icon={<IdcardOutlined />} 
            onClick={() => handleOpenGenerator(r)}
          >
            {r.card_status === 'created' ? 'Regenerate' : 'Generate'}
          </Button>
          {r.card_status === 'created' && r.card_url && (
            <Button onClick={() => setPreviewGeneratedCard(r.card_url)}>
              Preview
            </Button>
          )}
        </Space>
      )
    }
  ];

  const renderCardPreview = () => {
    if (!eventDetails || !selectedDesignId) return <Empty description="No design selected" />;
    if (!previewGuest) return null;

    const design = eventDetails.designs?.find(d => d.id === selectedDesignId);
    if (!design) return null;

    let config = {
      guest_name: { x: 50, y: 40, fontSize: 24, color: '#000000', fontFamily: 'Arial' },
      card_type: { x: 50, y: 60, fontSize: 14, color: '#000000', fontFamily: 'Arial' },
      qr_code: { x: 50, y: 85, size: 100 }
    };

    if (design.placeholders) {
      config = typeof design.placeholders === 'string' ? JSON.parse(design.placeholders) : design.placeholders;
    }

    const evPrefix = eventDetails.name.substring(0, 2).toUpperCase();
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
        {imageUrl === 'error' ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#cf1322', background: '#fff0f0' }}>
            <div>⚠️ Could not preview image</div>
            <div style={{ fontSize: 12 }}>Please select another category or try again.</div>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Card Design" style={{ width: '100%', display: 'block' }} />
        ) : (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Spin tip="Loading Image..." />
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

        {/* QR Code Section */}
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

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Event Cards Generator</Title>
        <Text type="secondary">Select an event to generate digital cards for your guests.</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col xs={24} md={8}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Event</Text>
            <Select 
              placeholder="Choose an event..." 
              style={{ width: '100%' }} 
              size="large"
              value={selectedEventId}
              onChange={setSelectedEventId}
              options={events.map(ev => ({ label: ev.name, value: ev.id }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} md={16}>
            {eventDetails && (
              <Space direction="vertical" size={2}>
                <Text type="secondary">Selected Event:</Text>
                <Title level={5} style={{ margin: 0 }}>{eventDetails.name}</Title>
              </Space>
            )}
          </Col>
        </Row>
      </Card>

      {selectedEventId && (
        <Card title="Event Guests" bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Table 
            columns={columns} 
            dataSource={guests} 
            loading={loadingGuests}
            rowKey={(r) => r.hash_id || r.id}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      <Modal
        title={null}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        centered
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: 24, background: '#f0f2f5', borderRadius: '12px 12px 0 0' }}>
          <Title level={4} style={{ margin: 0 }}>Card Generator</Title>
          <Text type="secondary">Generating card for {previewGuest?.contact?.first_name} {previewGuest?.contact?.last_name}</Text>
        </div>
        <div style={{ padding: 24 }}>
          {eventDetails?.designs && eventDetails.designs.length > 0 ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Card Category (Design)</Text>
                <Select
                  value={selectedDesignId}
                  onChange={setSelectedDesignId}
                  style={{ width: '100%' }}
                  size="large"
                  options={eventDetails.designs.map(d => ({ 
                    label: d.category, 
                    value: d.id 
                  }))}
                />
                
                <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>Card Type</Text>
                <Select
                  value={cardType}
                  onChange={setCardType}
                  style={{ width: '100%' }}
                  size="large"
                  options={[
                    { label: 'Single Card', value: 'SINGLE' },
                    { label: 'Double Card', value: 'DOUBLE' }
                  ]}
                />
              </div>

              {renderCardPreview()}

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  size="large" 
                  onClick={handleGenerateAndSave}
                  style={{ borderRadius: 8, padding: '0 40px' }}
                >
                  Generate & Save Card
                </Button>
              </div>
            </>
          ) : (
            <Empty description="No designs uploaded for this event. Admin must upload a design first." />
          )}
        </div>
      </Modal>

      <Modal
        title="Generated Card Preview"
        open={!!previewGeneratedCard}
        onCancel={() => setPreviewGeneratedCard(null)}
        footer={null}
        centered
        width={500}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '24px 24px 0 24px', background: '#f0f2f5', borderRadius: '12px 12px 0 0' }}>
          <Title level={4} style={{ margin: 0, paddingBottom: 16 }}>Card Preview</Title>
        </div>
        <div style={{ padding: 24, textAlign: 'center' }}>
          {previewGeneratedCard ? (
            <img 
              src={previewGeneratedCard} 
              alt="Generated Card" 
              style={{ width: '100%', maxWidth: '400px', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} 
            />
          ) : null}
          <div style={{ marginTop: 24 }}>
            <Button type="primary" onClick={() => {
              const link = document.createElement('a');
              link.href = previewGeneratedCard;
              link.download = 'Event_Card.png';
              link.click();
            }}>
              Download
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CardGenerator;
