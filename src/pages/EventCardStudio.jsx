import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card, Button, Input, message, Space, Typography, Row, Col, InputNumber, Badge, Spin, Select, Grid
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import eventsApi from '../api/eventsApi';
import { fetchAsBlob } from '../api/templatesApi';
import axiosInstance from '../api/axios';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const EventCardStudio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const designId = state?.designId;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [imageUrl, setImageUrl] = useState(null);
  const [config, setConfig] = useState({
    guest_name: { x: 50, y: 40, fontSize: 24, color: '#000000', fontFamily: 'Arial' },
    card_type: { x: 50, y: 60, fontSize: 14, color: '#000000', fontFamily: 'Arial' },
    qr_code: { x: 50, y: 85, size: 100 }
  });

  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const fontOptions = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Great Vibes', value: '"Great Vibes", cursive' },
    { label: 'Georgia', value: 'Georgia, serif' }
  ];

  const load = async () => {
    if (!designId) {
      message.error('No design selected.');
      navigate(`/events/${id}`);
      return;
    }

    setLoading(true);
    try {
      const res = await eventsApi.getEvent(id);
      const ev = res.data.data;
      setEvent(ev);

      const design = ev.designs?.find(d => d.id === designId);
      if (!design) {
        message.error('Design not found.');
        navigate(`/events/${id}`);
        return;
      }

      if (design.placeholders) {
        let parsed = design.placeholders;
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        setConfig(parsed);
      }

      if (design.card_url) {
        try {
          const blob = await fetchAsBlob(design.card_url);
          setImageUrl(URL.createObjectURL(blob));
        } catch (imgErr) {
          console.error("Image load error", imgErr);
          setImageUrl('error');
          message.error('Failed to load the design image.');
        }
      } else {
        message.warning('No image found for this design.');
      }
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [id]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await eventsApi.updateStudio(id, designId, { placeholders: config });
      message.success('Layout configuration saved successfully!');
      navigate(`/events/${id}`);
    } catch (e) {
      message.error('Failed to save layout configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!event) return null;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: isMobile ? '100%' : 'auto' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/events/${id}`)} />
            <div style={{ flex: 1 }}>
                <Title level={isMobile ? 4 : 3} style={{ margin: 0, fontSize: isMobile ? '18px' : '24px' }}>
                    Card Designer - {event.name}
                </Title>
            </div>
        </div>
        
        {!isMobile && (
            <div style={{ flex: 1, minWidth: '200px' }}>
                <Text type="secondary">Fine-tune the guest name and QR code positions for your event's digital card.</Text>
            </div>
        )}

        <div style={{ width: isMobile ? '100%' : 'auto' }}>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={saveConfig} 
            loading={saving} 
            size={isMobile ? 'middle' : 'large'} 
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Save Layout
          </Button>
        </div>
        
        {isMobile && (
            <div style={{ width: '100%', marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Fine-tune the guest name and QR code positions.</Text>
            </div>
        )}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <div style={{ padding: '20px', background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', maxHeight: isMobile ? 'none' : '75vh', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
              <Title level={4} style={{ margin: 0 }}>Design Elements</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Adjust element positions over the background image.</Text>
            </div>

            {/* Guest Name Group */}
            <div style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
              <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color="blue" /> Guest Name
              </Title>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>POSITION X (%)</Text>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} value={config.guest_name.x} onChange={(v) => setConfig({ ...config, guest_name: { ...config.guest_name, x: v } })} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>POSITION Y (%)</Text>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} value={config.guest_name.y} onChange={(v) => setConfig({ ...config, guest_name: { ...config.guest_name, y: v } })} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>FONT SIZE (PX)</Text>
                  <InputNumber min={8} max={200} style={{ width: '100%' }} value={config.guest_name.fontSize} onChange={(v) => setConfig({ ...config, guest_name: { ...config.guest_name, fontSize: v } })} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>COLOR</Text>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Input type="color" value={config.guest_name.color} onChange={(e) => setConfig({ ...config, guest_name: { ...config.guest_name, color: e.target.value } })} style={{ width: 40, height: 32, padding: 2, border: 'none', background: 'transparent' }} />
                    <Text style={{ fontSize: 12 }}>{config.guest_name.color}</Text>
                  </div>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>FONT FAMILY</Text>
                  <Select style={{ width: '100%' }} value={config.guest_name.fontFamily} options={fontOptions} onChange={(v) => setConfig({ ...config, guest_name: { ...config.guest_name, fontFamily: v } })} />
                </Col>
              </Row>
            </div>
            
            {/* Card Type Group */}
            <div style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
              <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color="cyan" /> Card Type
              </Title>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>POSITION X (%)</Text>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} value={config.card_type.x} onChange={(v) => setConfig({ ...config, card_type: { ...config.card_type, x: v } })} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>POSITION Y (%)</Text>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} value={config.card_type.y} onChange={(v) => setConfig({ ...config, card_type: { ...config.card_type, y: v } })} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>FONT SIZE (PX)</Text>
                  <InputNumber min={8} max={200} style={{ width: '100%' }} value={config.card_type.fontSize} onChange={(v) => setConfig({ ...config, card_type: { ...config.card_type, fontSize: v } })} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>COLOR</Text>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Input type="color" value={config.card_type.color} onChange={(e) => setConfig({ ...config, card_type: { ...config.card_type, color: e.target.value } })} style={{ width: 40, height: 32, padding: 2, border: 'none', background: 'transparent' }} />
                    <Text style={{ fontSize: 12 }}>{config.card_type.color}</Text>
                  </div>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>FONT FAMILY</Text>
                  <Select style={{ width: '100%' }} value={config.card_type.fontFamily} options={fontOptions} onChange={(v) => setConfig({ ...config, card_type: { ...config.card_type, fontFamily: v } })} />
                </Col>
              </Row>
            </div>

            {/* QR Code Group */}
            <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
              <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color="gold" /> QR Code
              </Title>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>POSITION X (%)</Text>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} value={config.qr_code.x} onChange={(v) => setConfig({ ...config, qr_code: { ...config.qr_code, x: v } })} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>POSITION Y (%)</Text>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} value={config.qr_code.y} onChange={(v) => setConfig({ ...config, qr_code: { ...config.qr_code, y: v } })} />
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>QR SIZE (PX)</Text>
                  <InputNumber min={20} max={500} style={{ width: '100%' }} value={config.qr_code.size} onChange={(v) => setConfig({ ...config, qr_code: { ...config.qr_code, size: v } })} />
                </Col>
              </Row>
            </div>
          </div>
        </Col>
        
        <Col xs={24} lg={14}>
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Badge status="processing" text="Live Canvas Preview" />
          </div>
          {imageUrl === 'error' ? (
            <div style={{ width: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff0f0', border: '1px solid #ffa39e', borderRadius: 12, color: '#cf1322' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
                <div>Could not preview image.</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Please select another design or try again.</div>
              </div>
            </div>
          ) : imageUrl ? (
            <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto', border: '1px solid #d9d9d9', background: '#fff', overflow: 'hidden', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <img src={imageUrl} alt="event card" style={{ width: '100%', display: 'block' }} />
              
              <div style={{ 
                position: 'absolute', 
                top: `${config.guest_name.y}%`, 
                left: `${config.guest_name.x}%`, 
                color: config.guest_name.color, 
                fontSize: `${config.guest_name.fontSize}px`, 
                fontFamily: config.guest_name.fontFamily, 
                fontWeight: 'bold', 
                transform: 'translate(-50%, -50%)', 
                border: '2px dashed #00b96b', 
                padding: '4px 8px', 
                background: 'rgba(255,255,255,0.7)', 
                whiteSpace: 'nowrap', 
                borderRadius: 4, 
                cursor: 'move', 
                userSelect: 'none', 
                zIndex: 10 
              }}>
                [GUEST NAME]
              </div>

              <div style={{ 
                position: 'absolute', 
                top: `${config.card_type.y}%`, 
                left: `${config.card_type.x}%`, 
                color: config.card_type.color, 
                fontSize: `${config.card_type.fontSize}px`, 
                fontFamily: config.card_type.fontFamily, 
                transform: 'translate(-50%, -50%)', 
                border: '2px dashed #1677ff', 
                padding: '2px 6px', 
                background: 'rgba(255,255,255,0.7)', 
                whiteSpace: 'nowrap', 
                fontWeight: 'bold', 
                borderRadius: 4, 
                cursor: 'move', 
                userSelect: 'none', 
                zIndex: 5 
              }}>
                [CARD TYPE]
              </div>

              <div style={{ 
                position: 'absolute', 
                top: `${config.qr_code.y}%`, 
                left: `${config.qr_code.x}%`, 
                transform: 'translate(-50%, -50%)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                zIndex: 8 
              }}>
                <div style={{ 
                  width: `${config.qr_code.size}px`, 
                  height: `${config.qr_code.size}px`, 
                  background: '#fff', 
                  border: '2px dashed #faad14', 
                  padding: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: 4, 
                  cursor: 'move', 
                  userSelect: 'none' 
                }}>
                  <div style={{ textAlign: 'center', fontSize: 10, color: '#faad14' }}>QR</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: 12 }}>
              <Spin tip="Loading image..." />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default EventCardStudio;
