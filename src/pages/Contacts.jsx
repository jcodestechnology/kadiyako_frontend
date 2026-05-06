import React, { useState, useEffect, useRef } from 'react';
import { Table, Typography, message, Input, Space, Button, Popconfirm, Avatar, Card, Switch, Tag, Tooltip, Grid } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ImportOutlined, 
  UserOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import contactsApi from '../api/contactsApi';
import ContactModal from '../components/Contacts/ContactModal';
import ImportModal from '../components/Contacts/ImportModal';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const Contacts = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
    search: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [toggling, setToggling] = useState({});

  const searchTimeoutRef = useRef(null);

  const fetchContacts = async (params = tableParams) => {
    try {
      setLoading(true);
      const response = await contactsApi.getContacts({
        search: params.search,
        page: params.pagination.current,
        per_page: params.pagination.pageSize,
      });
      setContacts(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      message.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [tableParams.pagination.current, tableParams.pagination.pageSize, tableParams.search]);

  const handleTableChange = (pagination) => {
    setTableParams({ ...tableParams, pagination });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setTableParams({
        ...tableParams,
        search: value,
        pagination: { ...tableParams.pagination, current: 1 },
      });
    }, 500);
  };

  const handleDelete = async (id) => {
    try {
      await contactsApi.deleteContact(id);
      message.success('Contact deleted successfully');
      fetchContacts();
    } catch (error) {
      message.error('Deletion failed');
    }
  };

  const handleToggleStatus = async (contact) => {
    setToggling(prev => ({ ...prev, [contact.id]: true }));
    try {
      const res = await contactsApi.toggleStatus(contact.id);
      const updated = res.data;
      setContacts(prev =>
        prev.map(c => c.id === contact.id ? { ...c, is_active: updated.is_active } : c)
      );
      message.success(`Contact ${updated.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      message.error('Failed to toggle status');
    } finally {
      setToggling(prev => ({ ...prev, [contact.id]: false }));
    }
  };

  const showEditModal = (contact) => {
    setEditingContact(contact);
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space size="middle">
          <Avatar 
            style={{ 
              backgroundColor: record.is_active ? '#0892d0' : '#bfbfbf', 
              verticalAlign: 'middle',
              opacity: record.is_active ? 1 : 0.7,
            }} 
            size="large"
            icon={<UserOutlined />}
          >
            {record.first_name.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ opacity: record.is_active ? 1 : 0.55 }}>
            <div style={{ fontWeight: '600', color: '#1f1f1f' }}>{record.full_name}</div>
            <Tag
              style={{ marginTop: 2, borderRadius: 10, fontSize: 11 }}
              color={record.is_active ? 'success' : 'default'}
            >
              {record.is_active ? 'Active' : 'Inactive'}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone Number',
      key: 'phone',
      render: (_, record) => (
        <Space size={4} style={{ opacity: record.is_active ? 1 : 0.5 }}>
          <PhoneOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
          <Text style={{ fontWeight: '500' }}>{record.phone_display}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, record) => (
        <Tooltip title={record.is_active ? 'Click to deactivate' : 'Click to activate'}>
          <Switch
            checked={record.is_active}
            loading={toggling[record.id]}
            onChange={() => handleToggleStatus(record)}
            checkedChildren="Active"
            unCheckedChildren="Off"
            style={{ backgroundColor: record.is_active ? '#0892d0' : undefined }}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#0892d0' }} />} 
            onClick={() => showEditModal(record)} 
          />
          <Popconfirm
            title="Delete Contact"
            description="Are you sure to delete this contact?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="contacts-container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        marginBottom: 24,
        gap: 12,
      }}>
        <h2 className="page-header-title" style={{ margin: 0 }}>Contacts Management</h2>
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto',
          alignItems: 'center',
        }}>
          <Input
            placeholder={isMobile ? 'Search...' : 'Search by name or phone...'}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onChange={handleSearch}
            style={{ flex: 1, minWidth: 120, maxWidth: isMobile ? '100%' : 280, borderRadius: 10 }}
            allowClear
          />
          <Tooltip title={isMobile ? 'Import Contacts' : ''}>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportVisible(true)}
              style={{ borderRadius: 10, height: 40, flexShrink: 0 }}
            >
              {!isMobile && 'Import'}
            </Button>
          </Tooltip>
          <Tooltip title={isMobile ? 'Add Contact' : ''}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditingContact(null); setModalVisible(true); }}
              style={{ borderRadius: 10, height: 40, padding: isMobile ? '0 12px' : '0 20px', flexShrink: 0 }}
            >
              {!isMobile && 'Add Contact'}
            </Button>
          </Tooltip>
        </div>
      </div>

      <Card 
        styles={{ body: { padding: '0' } }} 
        style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none' }}
      >
        <Table 
          columns={columns} 
          dataSource={contacts} 
          rowKey="id" 
          loading={loading}
          rowClassName={(record) => record.is_active ? '' : 'contact-row-inactive'}
          pagination={{ 
            ...tableParams.pagination,
            total,
            showSizeChanger: true,
            style: { padding: '20px' }
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <ContactModal 
        visible={modalVisible}
        contact={editingContact}
        onCancel={() => { setModalVisible(false); setEditingContact(null); }}
        onSuccess={() => { setModalVisible(false); setEditingContact(null); fetchContacts(); }}
      />

      <ImportModal 
        visible={importVisible}
        onCancel={() => setImportVisible(false)}
        onSuccess={() => { setImportVisible(false); fetchContacts(); }}
      />
    </div>
  );
};

export default Contacts;
