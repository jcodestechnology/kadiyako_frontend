import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import groupsApi from '../../api/groupsApi';

const GroupModal = ({ visible, onCancel, onSuccess, group = null }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      if (group) {
        form.setFieldsValue({ name: group.name });
      } else {
        form.resetFields();
      }
    }
  }, [visible, group, form]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const hide = message.loading(group ? 'Updating group...' : 'Creating group...', 0);
    try {
      const values = await form.validateFields();
      if (group) {
        await groupsApi.updateGroup(group.id, values);
        message.success('Group updated successfully');
      } else {
        await groupsApi.createGroup(values);
        message.success('Group created successfully');
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
      title={group ? 'Edit Group' : 'Create New Group'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={group ? 'Update' : 'Create'}
      confirmLoading={submitting}
      destroyOnClose
      width={440}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Group Name"
          rules={[
            { required: true, message: 'Group name is required' },
            { max: 100, message: 'Maximum 100 characters' },
          ]}
        >
          <Input placeholder="e.g. VIP Customers, Partners..." size="large" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GroupModal;
