import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Form,
  Grid,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  createTemplateCategory,
  createTemplateName,
  deleteTemplateCategory,
  deleteTemplateName,
  listTemplateCategories,
  listTemplateNames,
  updateTemplateCategory,
  updateTemplateName,
} from '../api/templatesApi';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const TemplateCatalog = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const [tab, setTab] = useState('names');
  const [loading, setLoading] = useState(true);
  const [names, setNames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const activeData = useMemo(() => (tab === 'names' ? names : categories), [tab, names, categories]);

  const load = async () => {
    setLoading(true);
    try {
      const [namesRes, categoriesRes] = await Promise.all([
        listTemplateNames({ per_page: 200, search: search || undefined }),
        listTemplateCategories({ per_page: 200, search: search || undefined }),
      ]);
      setNames(namesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, is_active: record.is_active });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (tab === 'names') {
        if (editing) {
          await updateTemplateName(editing.id, values);
          message.success('Template name updated.');
        } else {
          await createTemplateName(values);
          message.success('Template name created.');
        }
      } else {
        if (editing) {
          await updateTemplateCategory(editing.id, values);
          message.success('Category updated.');
        } else {
          await createTemplateCategory(values);
          message.success('Category created.');
        }
      }

      closeModal();
      await load();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    Modal.confirm({
      title: 'Delete item?',
      content: 'This will remove the item from the catalog.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          if (tab === 'names') {
            await deleteTemplateName(record.id);
          } else {
            await deleteTemplateCategory(record.id);
          }
          message.success('Deleted.');
          await load();
        } catch (e) {
          message.error(e?.response?.data?.message || 'Delete failed.');
        }
      },
    });
  };

  const toggleActive = async (record) => {
    const payload = { name: record.name, is_active: !record.is_active };
    try {
      if (tab === 'names') {
        await updateTemplateName(record.id, payload);
      } else {
        await updateTemplateCategory(record.id, payload);
      }
      await load();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Update failed.');
    }
  };

  const columns = [
    {
      title: tab === 'names' ? 'Template Name' : 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 160,
      render: (v) => (v ? <Badge status="success" text="Active" /> : <Badge status="default" text="Inactive" />),
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'toggle',
      width: 110,
      render: (_, record) => <Switch checked={record.is_active} onChange={() => toggleActive(record)} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button onClick={() => openEdit(record)}>Edit</Button>
          <Button danger onClick={() => remove(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        marginBottom: 24,
        gap: 12,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 className="page-header-title" style={{ margin: 0 }}>Template Catalog</h2>
          <Text type="secondary" style={{ fontSize: 13 }}>Register dropdown values for Template Names and Categories.</Text>
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
            placeholder={isMobile ? 'Search...' : 'Search catalog...'}
            style={{ flex: 1, minWidth: 180, maxWidth: isMobile ? '100%' : 320, borderRadius: 10 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 10, height: 40 }}>
            Add
          </Button>
        </div>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            {
              key: 'names',
              label: 'Template Names',
              children: (
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={names}
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 'max-content' }}
                />
              ),
            },
            {
              key: 'categories',
              label: 'Categories',
              children: (
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={categories}
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 'max-content' }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        onCancel={closeModal}
        onOk={save}
        okText={editing ? 'Update' : 'Create'}
        confirmLoading={saving}
        title={editing ? 'Edit Item' : 'Add Item'}
        destroyOnClose
      >
        <Form layout="vertical" form={form} initialValues={{ is_active: true }}>
          <Form.Item
            name="name"
            label={tab === 'names' ? 'Template Name' : 'Category'}
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder={tab === 'names' ? 'e.g. Wedding Classic' : 'e.g. Wedding'} />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateCatalog;

