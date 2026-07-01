import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Radio, Select, Space, message, Typography, Row, Col, Alert, Spin } from 'antd';
import { SendOutlined, InfoCircleOutlined } from '@ant-design/icons';
import contactsApi from '../../api/contactsApi';
import eventsApi from '../../api/eventsApi';
import groupsApi from '../../api/groupsApi';
import messagesApi from '../../api/messagesApi';
import smsTemplatesApi from '../../api/smsTemplatesApi';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

const MessagingPanel = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    
    // Data fetching states
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [events, setEvents] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    // Form watch values
    const messageType = Form.useWatch('type', form);
    const targetType = Form.useWatch('target_type', form);

    useEffect(() => {
        const fetchInitialData = async () => {
            setDataLoading(true);
            try {
                const [contactsRes, groupsRes, eventsRes, templatesRes] = await Promise.all([
                    contactsApi.getContacts({ per_page: 1000 }),
                    groupsApi.getGroups(),
                    eventsApi.getEvents({ per_page: 1000 }),
                    smsTemplatesApi.getTemplates()
                ]);

                setContacts(contactsRes.data?.data || contactsRes.data || []);
                setGroups(groupsRes.data?.data || groupsRes.data || []);
                setEvents(eventsRes.data?.data || eventsRes.data || []);
                setTemplates(templatesRes.data || []);
            } catch (err) {
                message.error('Failed to load form data');
            } finally {
                setDataLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleInsertPlaceholder = (placeholder) => {
        const currentMsg = form.getFieldValue('message') || '';
        form.setFieldsValue({ message: currentMsg + placeholder });
    };

    const handleTemplateSelect = (value) => {
        const template = templates.find(t => t.hash_id === value);
        if (template) {
            form.setFieldsValue({ message: template.content });
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await messagesApi.sendMessages(values);
            message.success(res.data?.message || 'Messages queued for sending successfully.');
            form.resetFields(['message', 'contacts']); // Reset specific fields
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to send messages');
        } finally {
            setLoading(false);
        }
    };

    if (dataLoading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Spin size="large" tip="Loading Messaging Panel..." />
            </div>
        );
    }

    return (
        <Card title={
            <Space>
                <SendOutlined />
                <span>Messaging Center</span>
            </Space>
        }>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                            type: 'normal',
                            target_type: 'single'
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="type" label="Message Type" rules={[{ required: true }]}>
                                    <Radio.Group buttonStyle="solid">
                                        <Radio.Button value="normal">Normal SMS</Radio.Button>
                                        <Radio.Button value="event">Event Reminder</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {messageType === 'event' && (
                                    <Form.Item name="event_id" label="Select Event" rules={[{ required: true, message: 'Please select an event' }]}>
                                        <Select placeholder="Select the event" showSearch optionFilterProp="children">
                                            {events.map(ev => (
                                                <Option key={ev.id} value={ev.id}>{ev.name}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="target_type" label="Target Audience" rules={[{ required: true }]}>
                                    <Radio.Group>
                                        <Radio value="single">Specific Contacts</Radio>
                                        <Radio value="group">Contact Group</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {targetType === 'group' && (
                                    <Form.Item name="group_id" label="Select Group" rules={[{ required: true, message: 'Please select a group' }]}>
                                        <Select placeholder="Select a contact group" showSearch optionFilterProp="children">
                                            {groups.map(g => (
                                                <Option key={g.id} value={g.id}>{g.name}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}
                                {targetType === 'single' && (
                                    <Form.Item name="contacts" label="Select Contacts" rules={[{ required: true, message: 'Please select at least one contact' }]}>
                                        <Select mode="multiple" placeholder="Select contacts" showSearch optionFilterProp="children">
                                            {contacts.map(c => (
                                                <Option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.phone})</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}
                            </Col>
                        </Row>

                        <Form.Item
                            name="template"
                            label="Use Template"
                            help="Optional: Select a saved message template to auto-fill the message box below."
                        >
                            <Select 
                                placeholder="Choose a saved template..." 
                                allowClear 
                                onChange={handleTemplateSelect}
                            >
                                {templates.map(t => (
                                    <Option key={t.hash_id} value={t.hash_id}>{t.title}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="message" label="Message Content" rules={[{ required: true, message: 'Please enter message content' }]}>
                            <TextArea rows={6} placeholder="Type your message here..." />
                        </Form.Item>

                        <div style={{ marginBottom: 24 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Available Placeholders (Click to insert):</Text>
                            <Space wrap>
                                <Button size="small" onClick={() => handleInsertPlaceholder('[NAME]')}>[NAME]</Button>
                                {messageType === 'event' && (
                                    <>
                                        <Button size="small" onClick={() => handleInsertPlaceholder('[AHADI]')}>[AHADI]</Button>
                                        <Button size="small" onClick={() => handleInsertPlaceholder('[KILICHOTOLEWA]')}>[KILICHOTOLEWA]</Button>
                                        <Button size="small" onClick={() => handleInsertPlaceholder('[KILICHOBAKI]')}>[KILICHOBAKI]</Button>
                                    </>
                                )}
                            </Space>
                        </div>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading} size="large">
                                Send Message
                            </Button>
                        </Form.Item>
                    </Form>
                </Col>

                <Col xs={24} lg={8}>
                    <Alert
                        message="About Event Reminders"
                        description={
                            <div style={{ fontSize: 13, marginTop: 8 }}>
                                <p>When sending an <b>Event Reminder</b>, the system will check if the selected contacts are registered as guests for the chosen event.</p>
                                <p>If a contact is <b>not</b> in the event, they will be automatically skipped.</p>
                                <ul>
                                    <li><b>[NAME]</b>: Replaced with contact's full name.</li>
                                    <li><b>[AHADI]</b>: Replaced with their total pledge amount.</li>
                                    <li><b>[KILICHOTOLEWA]</b>: Replaced with amount they have paid.</li>
                                    <li><b>[KILICHOBAKI]</b>: Replaced with their remaining balance.</li>
                                </ul>
                            </div>
                        }
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                    />
                </Col>
            </Row>
        </Card>
    );
};

export default MessagingPanel;
