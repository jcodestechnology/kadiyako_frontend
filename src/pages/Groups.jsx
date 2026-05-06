import React, { useState, useEffect, useRef } from 'react';
import {
  Table, Typography, message, Input, Space, Button,
  Popconfirm, Tag, Switch, Card, Badge, Tooltip, Grid
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, TeamOutlined
} from '@ant-design/icons';
import groupsApi from '../api/groupsApi';
import GroupModal from '../components/Groups/GroupModal';
import GroupViewDrawer from '../components/Groups/GroupViewDrawer';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
    search: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [viewGroup, setViewGroup] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [toggling, setToggling] = useState({});

  const searchTimeoutRef = useRef(null);

  const fetchGroups = async (params = tableParams) => {
    setLoading(true);
    try {
      const res = await groupsApi.getGroups({
        search: params.search,
        page: params.pagination.current,
        per_page: params.pagination.pageSize,
      });
      setGroups(res.data.data);
      setTotal(res.data.meta.total);
    } catch {
      message.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [tableParams.pagination.current, tableParams.pagination.pageSize, tableParams.search]);

  const handleSearch = (e) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setTableParams(prev => ({
        ...prev,
        search: value,
        pagination: { ...prev.pagination, current: 1 },
      }));
    }, 500);
  };

  const handleDelete = async (id) => {
    try {
      await groupsApi.deleteGroup(id);
      message.success('Group deleted');
      fetchGroups();
    } catch {
      message.error('Failed to delete group');
    }
  };

  const handleToggle = async (group) => {
    setToggling(prev => ({ ...prev, [group.id]: true }));
    try {
      await groupsApi.toggleGroup(group.id);
      setGroups(prev =>
        prev.map(g => g.id === group.id ? { ...g, is_active: !g.is_active } : g)
      );
      message.success(`Group ${group.is_active ? 'deactivated' : 'activated'}`);
    } catch {
      message.error('Toggle failed');
    } finally {
      setToggling(prev => ({ ...prev, [group.id]: false }));
    }
  };

  const openView = (group) => {
    setViewGroup(group);
    setDrawerVisible(true);
  };

  const columns = [
    {
      title: 'Group Name',
      key: 'name',
      render: (_, record) => (
        <Space>
          <div
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: record.is_active ? 'linear-gradient(135deg, #0892d0, #0670a8)' : '#d9d9d9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}
          >
            {record.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1f1f1f' }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              Created {new Date(record.created_at).toLocaleDateString()}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Members',
      key: 'members',
      width: 110,
      render: (_, record) => (
        <Badge
          count={record.members_count ?? 0}
          showZero
          style={{ backgroundColor: '#0892d0' }}
          overflowCount={9999}
        >
          <div style={{
            background: '#f0f8ff', border: '1px solid #bae0ff',
            borderRadius: 8, padding: '4px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <TeamOutlined style={{ color: '#0892d0' }} />
            <Text strong>{record.members_count ?? 0}</Text>
          </div>
        </Badge>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, record) => (
        <Tag
          color={record.is_active ? 'success' : 'default'}
          style={{ borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}
        >
          {record.is_active ? '● Active' : '○ Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Activate',
      key: 'toggle',
      width: 90,
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          loading={toggling[record.id]}
          onChange={() => handleToggle(record)}
          checkedChildren="On"
          unCheckedChildren="Off"
          style={{ backgroundColor: record.is_active ? '#0892d0' : undefined }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View & Manage Members">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openView(record)}
              style={{ borderRadius: 6 }}
            >
              View
            </Button>
          </Tooltip>
          <Tooltip title="Edit Name">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0892d0' }} />}
              onClick={() => { setEditingGroup(record); setModalVisible(true); }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Group"
            description="This will also remove all members from this group. Continue?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h2 className="page-header-title">Contact Groups</h2>
        <Space>
          <Input
            placeholder="Search groups..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onChange={handleSearch}
            style={{ width: 260, borderRadius: 10 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingGroup(null); setModalVisible(true); }}
            style={{ borderRadius: 10, height: 40, padding: '0 20px' }}
          >
            Create Group
          </Button>
        </Space>
      </div>

      <Card
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none' }}
      >
        <Table
          columns={columns}
          dataSource={groups}
          rowKey="id"
          loading={loading}
          pagination={{
            ...tableParams.pagination,
            total,
            showSizeChanger: true,
            style: { padding: 20 },
          }}
          onChange={(pagination) => setTableParams(prev => ({ ...prev, pagination }))}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <GroupModal
        visible={modalVisible}
        group={editingGroup}
        onCancel={() => { setModalVisible(false); setEditingGroup(null); }}
        onSuccess={() => { setModalVisible(false); setEditingGroup(null); fetchGroups(); }}
      />

      <GroupViewDrawer
        visible={drawerVisible}
        group={viewGroup}
        onClose={() => setDrawerVisible(false)}
        onGroupUpdated={fetchGroups}
      />
    </div>
  );
};

export default Groups;
