import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Dropdown, Avatar, Space, Breadcrumb, Badge } from 'antd';
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
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

const { Header, Sider, Content, Footer } = Layout;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard Overview',
    },
    {
      key: 'templates-section',
      icon: <PictureOutlined />,
      label: 'Card Templates',
      children: [
        { key: '/template-studio', label: 'Template Studio', icon: <UploadOutlined /> },
        { key: '/template-catalog', label: 'Template Catalog', icon: <TagsOutlined /> },
      ],
    },
    {
      key: 'events-section',
      icon: <CalendarOutlined />,
      label: 'Event Management',
      children: [
        { key: '/events', label: 'My Events' },
        { key: '/scan', label: 'Verify Access', icon: <ScanOutlined /> },
      ],
    },
    {
      key: 'contacts-section',
      icon: <TeamOutlined />,
      label: 'Contacts',
      children: [
        { key: '/contacts', label: 'My Contacts' },
        { key: '/contact-groups', label: 'Contact Groups', icon: <GroupOutlined /> },
      ],
    },
    {
      key: 'user-management',
      icon: <UserOutlined />,
      label: 'User Management',
      children: [
        {
          key: '/users',
          label: 'Users List',
        }
      ]
    },
    {
      key: 'access-management',
      icon: <SafetyCertificateOutlined />,
      label: 'Access Control',
      children: [
        {
          key: '/roles',
          label: 'Roles',
        },
        {
          key: '/permissions',
          label: 'Permissions',
        }
      ]
    },
  ];

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
      onClick: handleLogout,
    },
  ];

  // Generate Breadcrumbs based on path
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [
    {
      title: <Link to="/">Home</Link>,
      key: 'home',
    },
    ...pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSnippets.length - 1;
      const title = snippet.charAt(0).toUpperCase() + snippet.slice(1);
      return {
        key: url,
        title: isLast ? title : <Link to={url}>{title}</Link>,
      };
    }),
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
        theme="dark" 
        width={280} 
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
            items={menuItems}
            className="custom-menu"
          />
        </div>
      </Sider>
      <Layout className="site-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header
          style={{
            padding: 0,
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
              onClick={() => setCollapsed(!collapsed)}
              className={`hamburger-toggle ${collapsed ? 'active' : ''}`}
              aria-label="Toggle Sidebar"
            >
              <span className="hamburger-line line-1"></span>
              <span className="hamburger-line line-2"></span>
              <span className="hamburger-line line-3"></span>
            </button>
            
            <Breadcrumb items={breadcrumbItems} className="custom-breadcrumb-header" separator={<span style={{ color: '#0892d0' }}>/</span>} />
          </div>

          <div style={{ paddingRight: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Badge count={3} size="small" offset={[-4, 4]}>
              <Button 
                type="text" 
                icon={<BellOutlined style={{ fontSize: '18px', color: '#595959' }} />} 
                className="notification-btn"
              />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#0892d0' }} icon={<UserOutlined />} />
                <span style={{ fontWeight: 500, color: '#262626' }}>{user?.name || 'User'}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Content
            className="custom-content"
            style={{
              margin: 0,
              flex: 1,
            }}
          >
            <Outlet />
          </Content>
          <Footer style={{ textAlign: 'center', color: '#8c8c8c', padding: '16px 0', marginTop: 'auto', flexShrink: 0 }}>
            KADIYAKO ©{new Date().getFullYear()} Developed by <a href="https://abbelinedigital.co.tz/" target="_blank" rel="noopener noreferrer" style={{ color: '#0892d0', fontWeight: '600' }}>Abbeline Digital</a>
          </Footer>
        </div>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
