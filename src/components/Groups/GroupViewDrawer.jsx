import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Drawer, Table, Button, Select, Space, message, Typography,
  Avatar, Tag, Popconfirm, Spin, Empty, Divider, Badge
} from 'antd';
import {
  UserOutlined, DeleteOutlined, PlusOutlined, PhoneOutlined, SearchOutlined
} from '@ant-design/icons';
import groupsApi from '../../api/groupsApi';

const { Text, Title } = Typography;

const GroupViewDrawer = ({ visible, onClose, group, onGroupUpdated }) => {
  const [members, setMembers] = useState([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersPage, setMembersPage] = useState(1);

  const [availableOptions, setAvailableOptions] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const searchDebounce = useRef(null);

  // --- Load members ---
  const fetchMembers = useCallback(async (page = 1) => {
    if (!group) return;
    setMembersLoading(true);
    try {
      const res = await groupsApi.getMembers(group.id, { page, per_page: 10 });
      setMembers(res.data.data);
      setMembersTotal(res.data.meta.total);
      setMembersPage(page);
    } catch {
      message.error('Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }, [group]);

  useEffect(() => {
    if (visible && group) {
      fetchMembers(1);
      setSelectedContactIds([]);
      setAvailableOptions([]);
    }
  }, [visible, group, fetchMembers]);

  // --- Search available contacts (debounced) ---
  const handleSearch = (search) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!search) { setAvailableOptions([]); return; }

    setSearching(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await groupsApi.getAvailableContacts(group.id, search);
        const opts = res.data.map(c => ({
          value: c.id,
          label: `${c.full_name} — ${c.phone_display}`,
          contact: c,
        }));
        setAvailableOptions(opts);
      } catch {
        message.error('Search failed');
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // --- Add selected contacts ---
  const handleAddMembers = async () => {
    if (selectedContactIds.length === 0) {
      message.warning('Please select at least one contact');
      return;
    }
    setAdding(true);
    const hide = message.loading(`Adding ${selectedContactIds.length} contact(s)...`, 0);
    try {
      await groupsApi.addMembers(group.id, selectedContactIds);
      message.success(`${selectedContactIds.length} contact(s) added to group`);
      setSelectedContactIds([]);
      setAvailableOptions([]);
      fetchMembers(1);
      onGroupUpdated();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add contacts');
    } finally {
      hide();
      setAdding(false);
    }
  };

  // --- Remove a single member ---
  const handleRemove = async (contact) => {
    const hide = message.loading('Removing...', 0);
    try {
      await groupsApi.removeMembers(group.id, [contact.id]);
      message.success(`${contact.full_name} removed from group`);
      fetchMembers(membersPage);
      onGroupUpdated();
    } catch {
      message.error('Failed to remove contact');
    } finally {
      hide();
    }
  };

  const memberColumns = [
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space size="middle">
          <Avatar style={{ backgroundColor: record.is_active ? '#0892d0' : '#bfbfbf' }} icon={<UserOutlined />}>
            {record.first_name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.full_name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              <PhoneOutlined style={{ marginRight: 4 }} />{record.phone_display}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'default'}>
          {record.is_active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="Remove from group?"
          onConfirm={() => handleRemove(record)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{group?.name}</span>
          <Tag color={group?.is_active ? 'blue' : 'default'}>
            {group?.is_active ? 'Active' : 'Inactive'}
          </Tag>
          <Badge
            count={membersTotal}
            showZero
            style={{ backgroundColor: '#0892d0' }}
            overflowCount={999}
          />
        </Space>
      }
      open={visible}
      onClose={onClose}
      width={700}
      styles={{ body: { padding: '0 24px 24px' } }}
    >
      {/* ── Add Members Section ── */}
      <div style={{
        background: '#f0f8ff',
        border: '1px solid #bae0ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        marginTop: 16,
      }}>
        <Text strong style={{ display: 'block', marginBottom: 10, color: '#0892d0' }}>
          <PlusOutlined style={{ marginRight: 6 }} />Add Contacts to Group
        </Text>
        <Space style={{ width: '100%' }} direction="vertical" size={10}>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder={
              <Space>
                <SearchOutlined />
                <span>Search contacts by name or phone...</span>
              </Space>
            }
            filterOption={false}
            onSearch={handleSearch}
            onChange={setSelectedContactIds}
            value={selectedContactIds}
            options={availableOptions}
            notFoundContent={
              searching
                ? <div style={{ textAlign: 'center', padding: 8 }}><Spin size="small" /></div>
                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Type to search contacts" />
            }
            showSearch
            size="large"
            maxTagCount="responsive"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMembers}
            loading={adding}
            disabled={selectedContactIds.length === 0}
            style={{ borderRadius: 8 }}
          >
            Add {selectedContactIds.length > 0 ? `${selectedContactIds.length} ` : ''}Contact{selectedContactIds.length !== 1 ? 's' : ''}
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '0 0 16px' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {membersTotal} Member{membersTotal !== 1 ? 's' : ''}
        </Text>
      </Divider>

      {/* ── Members Table ── */}
      <Table
        columns={memberColumns}
        dataSource={members}
        rowKey="id"
        loading={membersLoading}
        size="small"
        pagination={{
          current: membersPage,
          pageSize: 10,
          total: membersTotal,
          onChange: fetchMembers,
          showTotal: (total) => `${total} contacts`,
          simple: true,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No contacts in this group yet. Use the search above to add some."
            />
          ),
        }}
      />
    </Drawer>
  );
};

export default GroupViewDrawer;
