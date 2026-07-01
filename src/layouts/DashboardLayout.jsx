import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Dropdown, Avatar, Space, Breadcrumb, Badge, Drawer, Grid, Card, List } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  UserAddOutlined,
  BellOutlined,
  GroupOutlined,
  PictureOutlined,
  UploadOutlined,
  TagsOutlined,
  CalendarOutlined,
  ScanOutlined,
  IdcardOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import echo from '../api/echo';
import { notification } from 'antd';
import './DashboardLayout.css';

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time Notification Listener
  React.useEffect(() => {
    if (user && user.id) {
      const channel = echo.private(`user.${user.id}`);
      
      const addNotification = (notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 10)); // Keep last 10
        setUnreadCount(prev => prev + 1);
        
        notification.open({
          message: notif.title,
          description: notif.description,
          placement: 'topRight',
          duration: 5,
          icon: notif.icon,
          onClick: () => setUnreadCount(0),
        });
      };

      channel.listen('.guest.checked-in', (e) => {
        addNotification({
          id: Date.now(),
          title: 'Guest Checked In',
          description: `${e.guest.name} arrived at ${e.event_name}`,
          icon: <TeamOutlined style={{ color: '#52c41a' }} />,
          time: new Date(),
          type: 'checkin'
        });
      });

      channel.listen('.payment.recorded', (e) => {
        addNotification({
          id: Date.now(),
          title: 'New Contribution',
          description: `Received ${parseInt(e.amount).toLocaleString()} TZS from ${e.guest_name}`,
          icon: <Badge status="success" />,
          time: new Date(),
          type: 'payment'
        });
      });

      return () => {
        echo.leave(`user.${user.id}`);
      };
    }
  }, [user]);

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') {
        navigate('/profile');
    } else if (key === 'logout') {
        handleLogout();
    } else {
        navigate(key);
        if (isMobile) {
            setMobileMenuVisible(false);
        }
    }
  };

  const notificationMenu = (
    <Card 
      title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Recent Notifications</span>
        <Button type="link" size="small" onClick={() => setUnreadCount(0)}>Clear</Button>
      </div>}
      bodyStyle={{ padding: 0 }}
      style={{ width: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: 16, border: 'none' }}
    >
      <List
        size="small"
        dataSource={notifications}
        locale={{ emptyText: <div style={{ padding: '24px', textAlign: 'center', color: '#bfbfbf' }}>No new alerts</div> }}
        renderItem={item => (
          <List.Item style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <List.Item.Meta
              avatar={<div style={{ marginTop: 4 }}>{item.icon}</div>}
              title={<span style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</span>}
              description={
                <div style={{ fontSize: 12, color: '#595959' }}>
                  {item.description}
                  <div style={{ color: '#bfbfbf', fontSize: 10, marginTop: 4 }}>Just now</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard Overview',
    },
    {
      key: 'templates-section',
      icon: <PictureOutlined />,
      label: 'Card Templates',
      permission: 'view_templates',
      children: [
        { key: '/template-studio', label: 'Template Builder', icon: <UploadOutlined />, permission: 'create_templates' },
        { key: '/template-catalog', label: 'Template Catalog', icon: <TagsOutlined />, permission: 'view_templates' },
      ],
    },
    {
      key: 'events-section',
      icon: <CalendarOutlined />,
      label: 'Event Management',
      permission: 'view_events',
      children: [
        { key: '/events', label: 'My Events', permission: 'view_events' },
        { key: '/cards', label: 'Event Cards', icon: <IdcardOutlined />, permission: 'view_events' },
        { key: '/scan', label: 'Verify Access', icon: <ScanOutlined />, permission: 'verify_attendance' },
      ],
    },
    {
      key: 'contacts-section',
      icon: <TeamOutlined />,
      label: 'Contacts',
      permission: 'view_contacts',
      children: [
        { key: '/contacts', label: 'My Contacts', permission: 'view_contacts' },
        { key: '/contact-groups', label: 'Contact Groups', icon: <GroupOutlined />, permission: 'view_contacts' },
      ],
    },
    {
      key: 'messaging-section',
      icon: <MessageOutlined />,
      label: 'Messaging',
      permission: 'send_messages',
      children: [
        { key: '/messaging', label: 'Messaging Center', permission: 'send_messages' },
        { key: '/messaging/history', label: 'Message History', permission: 'view_messages' },
        { key: '/messaging/templates', label: 'Message Templates', permission: 'manage_templates' },
      ],
    },
    {
      key: 'user-management',
      icon: <UserOutlined />,
      label: 'User Management',
      permission: 'manage_users',
      children: [
        {
          key: '/users',
          label: 'Users List',
          permission: 'view_users',
        }
      ]
    },
    {
      key: 'packages-management',
      icon: <TagsOutlined />,
      label: 'Package Management',
      permission: 'manage_packages',
      children: [
        {
          key: '/dashboard/packages',
          label: 'Manage Packages',
          permission: 'manage_packages',
        }
      ]
    },
    {
      key: 'access-management',
      icon: <SafetyCertificateOutlined />,
      label: 'Access Control',
      permission: 'manage_access',
      children: [
        {
          key: '/roles',
          label: 'Roles',
          permission: 'manage_roles',
        },
        {
          key: '/permissions',
          label: 'Permissions',
          permission: 'manage_permissions',
        }
      ]
    },
  ];

  const hasPermission = (perm) => {
    if (!perm) return true;
    if (user?.roles?.some(r => r.slug === 'super-admin' || r.slug === 'admin')) return true;
    return user?.permissions?.includes(perm);
  };

  const filterMenu = (items) => {
    return items
      .filter(item => hasPermission(item.permission))
      .map(item => {
        if (item.children) {
          const children = filterMenu(item.children);
          if (children.length === 0) return null;
          return { ...item, children };
        }
        return item;
      })
      .filter(item => item !== null);
  };

  const filteredMenuItems = filterMenu(menuItems);

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  // Generate Breadcrumbs based on path
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [
    {
      title: <Link to="/dashboard">Dashboard</Link>,
      key: 'dashboard-home',
    },
    ...pathSnippets
      .filter(snippet => snippet !== 'dashboard')
      .map((snippet, index, filteredArr) => {
        const url = `/${pathSnippets.slice(0, pathSnippets.indexOf(snippet) + 1).join('/')}`;
        const isLast = index === filteredArr.length - 1;
        const title = snippet.charAt(0).toUpperCase() + snippet.slice(1);
        return {
          key: url,
          title: isLast ? title : <Link to={url}>{title}</Link>,
        };
      }),
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {!isMobile ? (
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          theme="dark" 
          width={280} 
          collapsedWidth={80}
          className="custom-sider"
        >
          <div className="logo-container">
            <img src="/LOGO1.png" alt="Kadiyako Logo" className={`logo-img-new ${collapsed ? 'collapsed' : ''}`} />
            {!collapsed && <span className="logo-text-new">KADI YAKO</span>}
          </div>
          <div style={{ flex: 1, overflow: 'auto', height: 'calc(100vh - 80px)' }} className="sider-menu-scroll">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={handleMenuClick}
              items={filteredMenuItems}
              className="custom-menu"
            />
          </div>
        </Sider>
      ) : (
        <Drawer
          title={
            <div className="logo-container" style={{ background: 'transparent', border: 'none', padding: 0, justifyContent: 'flex-start' }}>
              <img src="/LOGO1.png" alt="Kadiyako Logo" style={{ height: 32 }} />
              <span className="logo-text-new" style={{ color: '#ffffff', fontSize: 18, marginLeft: 8 }}>KADI YAKO</span>
            </div>
          }
          placement="left"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          width={280}
          bodyStyle={{ 
            padding: 0, 
            background: 'linear-gradient(180deg, #0892d0 0%, #000080 100%)' 
          }}
          headerStyle={{ 
            background: '#0892d0', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff'
          }}
          closeIcon={<div style={{ color: '#ffffff' }}><MenuFoldOutlined /></div>}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={handleMenuClick}
            items={filteredMenuItems}
            className="custom-menu"
            style={{ height: '100%', borderRight: 0 }}
          />
        </Drawer>
      )}
      <Layout className="site-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header
          style={{
            padding: isMobile ? '0 16px' : 0,
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => isMobile ? setMobileMenuVisible(true) : setCollapsed(!collapsed)}
              className={`hamburger-toggle ${(!isMobile && collapsed) || (isMobile && mobileMenuVisible) ? 'active' : ''}`}
              aria-label="Toggle Sidebar"
            >
              <span className="hamburger-line line-1"></span>
              <span className="hamburger-line line-2"></span>
              <span className="hamburger-line line-3"></span>
            </button>
            
            {!isMobile && <Breadcrumb items={breadcrumbItems} className="custom-breadcrumb-header" separator={<span style={{ color: '#0892d0' }}>/</span>} />}
          </div>

          <div style={{ paddingRight: isMobile ? 0 : '24px', display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
            <Dropdown dropdownRender={() => notificationMenu} placement="bottomRight" trigger={['click']}>
              <Badge count={unreadCount} size="small" offset={[-4, 4]}>
                <Button 
                  type="text" 
                  icon={<BellOutlined style={{ fontSize: isMobile ? '16px' : '18px', color: '#595959' }} />} 
                  className="notification-btn"
                  style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}
                />
              </Badge>
            </Dropdown>
            
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={isMobile ? 'small' : 'default'} style={{ backgroundColor: '#0892d0' }} src={user?.profile_photo_url} icon={<UserOutlined />} />
                {!isMobile && <span style={{ fontWeight: 500, color: '#262626' }}>{user?.name || 'User'}</span>}
              </Space>
            </Dropdown>
          </div>
        </Header>
        
        <div style={{ padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Content
            className="custom-content"
            style={{
              margin: 0,
              flex: 1,
            }}
          >
            <Outlet />
          </Content>
          <Footer style={{ textAlign: 'center', color: '#8c8c8c', padding: '16px 0', marginTop: 'auto', flexShrink: 0, fontSize: isMobile ? '12px' : '14px' }}>
            KADIYAKO ©{new Date().getFullYear()} Developed by <a href="https://abbelinedigital.co.tz/" target="_blank" rel="noopener noreferrer" style={{ color: '#0892d0', fontWeight: '600' }}>Abbeline Digital</a>
          </Footer>
        </div>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
