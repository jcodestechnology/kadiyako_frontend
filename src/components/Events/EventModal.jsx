import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Switch, Row, Col, message } from 'antd';
import dayjs from 'dayjs';
import eventsApi from '../../api/eventsApi';
import { listAdminTemplates } from '../../api/templatesApi';
import { useAuth } from '../../context/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const EventModal = ({ visible, event, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const { user } = useAuth();
  
  const isAdmin = user?.roles?.some(r => r.slug === 'super-admin' || r.slug === 'admin');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await listAdminTemplates({ is_active: 1, per_page: 100 });
        setTemplates(res.data?.data || res.data || []);
      } catch (e) {}
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (visible) {
      if (event) {
        form.setFieldsValue({
          name: event.name,
          description: event.description,
          event_date: event.event_date ? dayjs(event.event_date) : null,
          location: event.location,
          status: event.status,
          is_active: event.is_active,
          template_id: event.template_id,
          card_requirements: event.card_requirements,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 'upcoming',
          is_active: true,
        });
      }
    }
  }, [visible, event, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        ...values,
        event_date: values.event_date ? values.event_date.format('YYYY-MM-DD HH:mm:ss') : null,
      };

      if (event) {
        await eventsApi.updateEvent(event.hash_id || event.id, payload);
        message.success('Event updated successfully');
      } else {
        await eventsApi.createEvent(payload);
        message.success('Event created successfully');
      }
      onSuccess();
    } catch (error) {
      if (error.errorFields) return; // Validation error
      message.error(event ? 'Failed to update event' : 'Failed to create event');
    }
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1f1f1f', paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
          {event ? 'Edit Event' : 'Create New Event'}
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText={event ? 'Save Changes' : 'Create Event'}
      cancelText="Cancel"
      width={600}
      centered
      okButtonProps={{
        style: { borderRadius: 8, padding: '0 24px', height: 40, fontWeight: 500 }
      }}
      cancelButtonProps={{
        style: { borderRadius: 8, padding: '0 24px', height: 40 }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        <Form.Item
          name="name"
          label={<span style={{ fontWeight: 500 }}>Event Name</span>}
          rules={[{ required: true, message: 'Please enter the event name' }]}
        >
          <Input placeholder="E.g., Annual Tech Conference" size="large" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="event_date"
              label={<span style={{ fontWeight: 500 }}>Date & Time</span>}
              rules={[{ required: true, message: 'Please select date and time' }]}
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm" 
                size="large" 
                style={{ width: '100%', borderRadius: 8 }} 
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label={<span style={{ fontWeight: 500 }}>Status</span>}
              rules={[{ required: true, message: 'Please select a status' }]}
            >
              <Select size="large" style={{ borderRadius: 8 }}>
                <Option value="upcoming">Upcoming</Option>
                <Option value="ongoing">Ongoing</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="location"
          label={<span style={{ fontWeight: 500 }}>Location</span>}
        >
          <Input placeholder="E.g., Grand Hyatt Hotel / Zoom Link" size="large" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span style={{ fontWeight: 500 }}>Description</span>}
        >
          <TextArea 
            placeholder="Provide some details about the event..." 
            rows={4} 
            style={{ borderRadius: 8 }} 
          />
        </Form.Item>

        {!isAdmin && (
          <>
            <Form.Item
              name="template_id"
              label={<span style={{ fontWeight: 500 }}>Sample Design Style</span>}
            >
              <Select placeholder="Select a sample design style (optional)" size="large" allowClear>
                {templates.map(t => (
                  <Option key={t.hash_id || t.id} value={t.hash_id || t.id}>{t.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="card_requirements"
              label={<span style={{ fontWeight: 500 }}>Card Design Requirements</span>}
              tooltip="Provide details to the admin on how you want your event card to look."
            >
              <TextArea 
                placeholder="E.g., I want a blue theme, with a large QR code in the middle..." 
                rows={3} 
                style={{ borderRadius: 8 }} 
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="is_active"
          valuePropName="checked"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
            <div>
              <div style={{ fontWeight: 500, color: '#262626' }}>Active Status</div>
              <div style={{ fontSize: 13, color: '#8c8c8c' }}>Users can interact with active events</div>
            </div>
            <Switch />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EventModal;
