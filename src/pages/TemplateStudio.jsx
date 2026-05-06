import React, { useEffect, useState } from 'react';
import {
  Card, Button, Form, Input, Upload, message, Table, Space, Typography, Tag, Modal, Row, Col, InputNumber, Badge, Spin, Select
} from 'antd';
import { UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { listAdminTemplates, createTemplate, toggleTemplate, fetchAsBlob, updateTemplate } from '../api/templatesApi';

const { Text, Title } = Typography;

const TemplateStudio = () => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [config, setConfig] = useState({
    guest_name: { x: 50, y: 40, fontSize: 24, color: '#000000', fontFamily: 'Arial' },
    card_type: { x: 50, y: 60, fontSize: 14, color: '#000000', fontFamily: 'Arial' },
    qr_code: { x: 50, y: 85, size: 100 }
  });

  const fontOptions = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Great Vibes', value: '"Great Vibes", cursive' },
    { label: 'Georgia', value: 'Georgia, serif' }
  ];

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAdminTemplates({ per_page: 50 });
      setTemplates(res.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, []);

  const onSubmit = async (values) => {
    const templateFile = values.template_file?.[0]?.originFileObj;
    if (!templateFile) {
      message.error('Template image is required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('type', 'image');
    formData.append('is_active', '1');
    formData.append('template_file', templateFile);
    
    // Default placeholders
    const defaultPlaceholders = JSON.stringify({
      guest_name: { x: 50, y: 40, fontSize: 24, color: '#000000', fontFamily: 'Arial' },
      card_type: { x: 50, y: 60, fontSize: 14, color: '#000000', fontFamily: 'Arial' },
      qr_code: { x: 50, y: 85, size: 100 }
    });
    formData.append('placeholders[]', defaultPlaceholders);

    setSubmitting(true);
    try {
      await createTemplate(formData);
      message.success('Template imported successfully.');
      form.resetFields();
      await load();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (record) => {
    try {
      await toggleTemplate(record.id);
      message.success('Template updated.');
      await load();
    } catch (e) {
      message.error('Failed to update template.');
    }
  };

  const openConfig = async (record) => {
    setCurrentTemplate(record);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    try {
      const parsed = record.placeholders && record.placeholders.length > 0 
        ? JSON.parse(record.placeholders[0]) 
        : null;
      if (parsed && parsed.guest_name) {
        let qrCode = parsed.qr_code || { x: 50, y: 85, size: 100 };
        if (qrCode.y > 100 || qrCode.y < 0) qrCode.y = 85;
        
        let guestName = parsed.guest_name || { x: 50, y: 40, fontSize: 24, color: '#000000', fontFamily: 'Arial' };
        if (guestName.y > 100 || guestName.y < 0) guestName.y = 40;
        
        let cardType = parsed.card_type || { x: 50, y: 60, fontSize: 14, color: '#000000', fontFamily: 'Arial' };
        if (cardType.y > 100 || cardType.y < 0) cardType.y = 60;

        setConfig({
          guest_name: guestName,
          card_type: cardType,
          qr_code: qrCode
        });
      } else {
        setConfig({
          guest_name: { x: 50, y: 40, fontSize: 24, color: '#000000', fontFamily: 'Arial' },
          card_type: { x: 50, y: 60, fontSize: 14, color: '#000000', fontFamily: 'Arial' },
          qr_code: { x: 50, y: 85, size: 100 }
        });
      }
    } catch (e) {
      // Use defaults if parsing fails
      setConfig({
        guest_name: { x: 50, y: 40, fontSize: 24, color: '#000000', fontFamily: 'Arial' },
        card_type: { x: 50, y: 60, fontSize: 14, color: '#000000', fontFamily: 'Arial' },
        qr_code: { x: 50, y: 85, size: 100 }
      });
    }
    setConfigModalVisible(true);

    const targetUrl = record.preview_url || record.file_url;
    if (targetUrl) {
      try {
        const blob = await fetchAsBlob(targetUrl);
        setImageUrl(URL.createObjectURL(blob));
      } catch (err) {
        message.error('Failed to load template image.');
      }
    }
  };

  const saveConfig = async () => {
    try {
      await updateTemplate(currentTemplate.id, {
        placeholders: [JSON.stringify(config)]
      });
      message.success('Layout configuration saved successfully!');
      setConfigModalVisible(false);
      load();
    } catch (e) {
      message.error('Failed to save layout configuration.');
    }
  };

  const closeConfig = () => {
    setConfigModalVisible(false);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: () => <Tag color="blue">Image Template</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v) => (v ? <Badge status="success" text="Active" /> : <Badge status="default" text="Inactive" />),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            ghost 
            icon={<SettingOutlined />} 
            onClick={() => openConfig(record)}
            style={{ borderRadius: 6 }}
          >
            Configure
          </Button>
          <Button 
            onClick={() => handleToggle(record)} 
            type={record.is_active ? 'default' : 'primary'}
            style={{ borderRadius: 6 }}
          >
            {record.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Template Studio</Title>
        <Text type="secondary">Import image templates from designers and configure data overlays (Name, QR Code).</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="Import New Template" bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Form layout="vertical" form={form} onFinish={onSubmit}>
              <Form.Item name="name" label="Template Name" rules={[{ required: true }]}>
                <Input placeholder="E.g., VIP Wedding Card" size="large" />
              </Form.Item>
              <Form.Item
                name="template_file"
                label="Template Background Image"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList}
                rules={[{ required: true }]}
              >
                <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                  <Button icon={<UploadOutlined />}>Select Image File</Button>
                </Upload>
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block size="large">
                Upload & Import
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="My Templates" bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Table
              rowKey="id"
              dataSource={templates}
              columns={columns}
              loading={loading}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Visual Layout Configurator"
        open={configModalVisible}
        onCancel={closeConfig}
        onOk={saveConfig}
        width={900}
        okText="Save Layout"
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={10}>
            <div style={{ padding: '20px', background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                <Title level={4} style={{ margin: 0 }}>Design Elements</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Fine-tune element positions and styles.</Text>
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
            {imageUrl ? (
              <div style={{ position: 'relative', width: '100%', border: '1px solid #d9d9d9', background: '#fff', minHeight: 400, overflow: 'hidden', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <img src={imageUrl} alt="template" style={{ width: '100%', display: 'block' }} />
                
                <div style={{ position: 'absolute', top: `${config.guest_name.y}%`, left: `${config.guest_name.x}%`, color: config.guest_name.color, fontSize: config.guest_name.fontSize, fontFamily: config.guest_name.fontFamily, fontWeight: 'bold', transform: 'translate(-50%, -50%)', border: '2px dashed #00b96b', padding: '4px 12px', background: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', borderRadius: 4, cursor: 'move', userSelect: 'none', zIndex: 10 }}>
                  [GUEST NAME]
                </div>

                <div style={{ position: 'absolute', top: `${config.card_type.y}%`, left: `${config.card_type.x}%`, color: config.card_type.color, fontSize: config.card_type.fontSize, fontFamily: config.card_type.fontFamily, transform: 'translate(-50%, -50%)', border: '2px dashed #1677ff', padding: '2px 8px', background: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', fontWeight: 'bold', borderRadius: 4, cursor: 'move', userSelect: 'none', zIndex: 5 }}>
                  [CARD TYPE]
                </div>

                <div style={{ position: 'absolute', top: `${config.qr_code.y}%`, left: `${config.qr_code.x}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 8 }}>
                  <div style={{ width: config.qr_code.size, height: config.qr_code.size, background: '#fff', border: '2px dashed #faad14', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'move', userSelect: 'none' }}>
                    <div style={{ textAlign: 'center', fontSize: 10, color: '#faad14' }}>QR CODE<br/>{config.qr_code.size}px</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', border: '1px solid #d9d9d9' }}>
                <Spin tip="Loading image..." />
              </div>
            )}
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default TemplateStudio;
