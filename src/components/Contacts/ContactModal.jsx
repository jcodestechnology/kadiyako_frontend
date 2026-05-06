import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import contactsApi from '../../api/contactsApi';

const ContactModal = ({ visible, onCancel, onSuccess, contact = null }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  useEffect(() => {
    if (visible) {
      if (contact) {
        form.setFieldsValue({
          ...contact,
          phone: contact.phone_edit || contact.phone
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, contact, form]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const hide = message.loading(contact ? 'Updating contact...' : 'Creating contact...', 0);
    try {
      const values = await form.validateFields();
      if (contact) {
        await contactsApi.updateContact(contact.id, values);
        message.success('Contact updated successfully');
      } else {
        await contactsApi.createContact(values);
        message.success('Contact created successfully');
      }
      onSuccess();
    } catch (error) {
      if (error.response) {
        message.error(error.response.data.message || 'Operation failed');
      }
    } finally {
      hide();
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={contact ? 'Edit Contact' : 'Add New Contact'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={contact ? 'Update' : 'Create'}
      confirmLoading={submitting}
      destroyOnClose
      width={600}
      styles={{ body: { paddingTop: '20px' } }}
    >
      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '16px' }}>
          <Form.Item name="title" label="Title">
            <Input placeholder="Mr/Ms" />
          </Form.Item>
          <Form.Item
            name="first_name"
            label="First Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="John" />
          </Form.Item>
          <Form.Item name="last_name" label="Last Name">
            <Input placeholder="Doe" />
          </Form.Item>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <Form.Item 
            name="phone" 
            label="Phone Number"
            extra="Format: 07xxxxxxxx or 06xxxxxxxx (exactly 10 digits)"
            rules={[
              { required: true, message: 'Phone number is required' },
              { pattern: /^(07|06)[0-9]{8}$/, message: 'Must start with 07 or 06 and be exactly 10 digits' }
            ]}
          >
            <Input placeholder="e.g. 0712345678" maxLength={10} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default ContactModal;
