import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Grid, Input, Modal, Row, Select, Space, Tag, Typography, Button, Skeleton, Empty, message } from 'antd';
import { PictureOutlined, EyeOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { listTemplateCategories, listTemplates, fetchAsBlob } from '../api/templatesApi';
import eventsApi from '../api/eventsApi';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const formatPlaceholderLabel = (key) => {
  if (key === 'guest_name') return 'Guest Name';
  if (key === 'card_type') return 'Card Type';
  if (key === 'qr_code') return 'QR Code';
  if (key === 'event_name') return 'Event Name';
  if (key === 'custom_texts') return 'Custom Texts';
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const renderPlaceholders = (placeholders, type) => {
  if (!placeholders || !placeholders.length) return <Text type="secondary">—</Text>;
  
  let list = placeholders;
  if (type === 'image') {
    try {
      const parsed = JSON.parse(placeholders[0]);
      list = Object.keys(parsed).map(formatPlaceholderLabel);
    } catch (e) {
      // Keep as is if parsing fails
    }
  }

  return (
    <Space size={[0, 4]} wrap>
      {list.map((p, i) => <Tag key={i} color="purple">{p}</Tag>)}
    </Space>
  );
};

const TemplateCover = ({ template, onPreview }) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;
    const load = async () => {
      const targetUrl = template.preview_url || template.file_url;
      if (!targetUrl) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const blob = await fetchAsBlob(targetUrl);
        if (!isMounted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (e) {
        // failed to load
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [template]);

  if (loading) return <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}><Skeleton.Image active /></div>;
  if (!url) return <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}><PictureOutlined style={{ fontSize: 48, color: '#d9d9d9' }} /></div>;
  
  return (
    <div className="template-cover-container" style={{ position: 'relative', height: 240, overflow: 'hidden', borderBottom: '1px solid #f0f0f0' }}>
      <img className="template-img" src={url} alt={template.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
      <div className="template-overlay" style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, transition: 'opacity 0.3s ease'
      }}>
        <Button shape="round" type="primary" size="large" icon={<EyeOutlined />} onClick={() => onPreview(template)}>
          Preview Image
        </Button>
      </div>
    </div>
  );
};

const Templates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState();
  const [type, setType] = useState();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const categories = useMemo(() => categoryOptions.map((c) => c.name), [categoryOptions]);

  const loadCategories = async () => {
    try {
      const res = await listTemplateCategories({ is_active: true, per_page: 200 });
      setCategoryOptions(res.data || []);
    } catch {
      // ignore; gallery still works without lookups
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await listTemplates({
        search: search || undefined,
        category: category || undefined,
        type: type || undefined,
        per_page: 50,
      });
      setTemplates(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadTemplates();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, type]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openPreview = async (template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);

    const targetUrl = template?.preview_url || template?.file_url;

    if (!targetUrl) {
      setPreviewUrl(null);
      return;
    }

    setPreviewLoading(true);
    try {
      const blob = await fetchAsBlob(targetUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewTemplate(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <div>
      <style>{`
        .template-cover-container:hover .template-img {
          transform: scale(1.08);
        }
        .template-cover-container:hover .template-overlay {
          opacity: 1 !important;
        }
      `}</style>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        marginBottom: 24,
        gap: 12,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 className="page-header-title" style={{ margin: 0 }}>Template Gallery</h2>
          <Text type="secondary" style={{ fontSize: 13 }}>Browse active card templates and preview designs.</Text>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto',
          alignItems: 'center',
        }}>
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isMobile ? 'Search...' : 'Search templates by name...'}
            style={{ flex: 1, minWidth: 160, maxWidth: isMobile ? '100%' : 320, borderRadius: 10 }}
          />
          <Select
            allowClear
            value={category}
            onChange={setCategory}
            placeholder="Category"
            style={{ minWidth: 160, borderRadius: 10 }}
            options={categories.map((c) => ({ label: c, value: c }))}
          />
          <Select
            allowClear
            value={type}
            onChange={setType}
            placeholder="Type"
            style={{ minWidth: 120, borderRadius: 10 }}
            options={[
              { label: 'HTML', value: 'html' },
              { label: 'Image', value: 'image' },
            ]}
          />
        </div>
      </div>

      <Space direction="vertical" size={14} style={{ width: '100%' }}>

        {loading ? (
          <Card>
            <Skeleton active />
          </Card>
        ) : templates.length === 0 ? (
          <Card>
            <Empty description="No templates found." />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {templates.map((t) => (
              <Col key={t.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  hoverable
                  cover={<TemplateCover template={t} onPreview={openPreview} />}
                  style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  styles={{ body: { padding: '16px', textAlign: 'center' } }}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f', marginBottom: 16 }}>
                    {t.name}
                  </div>
                  <Button type="primary" block size="large" icon={<CheckCircleOutlined />} onClick={async () => {
                     const eventId = location.state?.eventId;
                     if (eventId) {
                       const hide = message.loading('Updating event template...', 0);
                       try {
                         await eventsApi.updateEvent(eventId, { template_id: t.id });
                         hide();
                         message.success(`Template "${t.name}" assigned to event!`);
                         navigate(`/events/${eventId}`);
                       } catch (e) {
                         hide();
                         message.error('Failed to assign template.');
                       }
                     } else {
                       message.success(`Template "${t.name}" selected! You can now apply it to your events.`);
                     }
                  }} style={{ borderRadius: 8 }}>
                    {location.state?.eventId ? 'Select for Event' : 'Choose Template'}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Space>

      <Modal
        open={previewOpen}
        onCancel={closePreview}
        footer={null}
        width={520}
        centered
        title={previewTemplate?.name || 'Template Preview'}
        destroyOnClose
      >
        {previewLoading ? (
          <Skeleton active />
        ) : previewUrl ? (
          <div style={{ textAlign: 'center', background: '#f9f9f9', borderRadius: 8, padding: 16 }}>
            <img
              src={previewUrl}
              alt={previewTemplate?.name || 'Preview'}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            />
          </div>
        ) : (
          <Empty description="No preview image available for this template." />
        )}
      </Modal>
    </div>
  );
};

export default Templates;
