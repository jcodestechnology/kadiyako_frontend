import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Typography, Space, message, Tag, Descriptions, Button, Result, Spin, Divider } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, CalendarOutlined, IdcardOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Title, Text } = Typography;

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Keep focus on the input for handheld scanners
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    const interval = setInterval(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (cardNumber) => {
    if (!cardNumber) return;
    setLoading(true);
    setScanResult(null);
    try {
      const res = await axiosInstance.post('/guests/verify', { card_number: cardNumber });
      setScanResult({
        success: true,
        ...res.data.data
      });
      message.success('Card Verified!');
    } catch (e) {
      setScanResult({
        success: false,
        message: e.response?.data?.message || 'Verification Failed'
      });
      message.error('Invalid Card');
    } finally {
      setLoading(false);
      setInputValue('');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2}><ScanOutlined /> Event Access Control</Title>
        <Text type="secondary">Scan guest QR codes or enter card numbers manually to verify attendance.</Text>
      </div>

      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: 40, background: '#fafafa', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <Text strong style={{ display: 'block', marginBottom: 16 }}>READY TO SCAN</Text>
            <Input 
              ref={inputRef}
              placeholder="Waiting for scan..." 
              size="large"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => handleScan(e.target.value)}
              prefix={<ScanOutlined style={{ color: '#0892d0' }} />}
              autoFocus
              style={{ borderRadius: 12, height: 54, fontSize: 18 }}
            />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 12, display: 'block' }}>
              Handheld scanners will automatically submit the code.
            </Text>
          </div>
        </div>

        <div style={{ padding: 40, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}><Text>Verifying with server...</Text></div>
            </div>
          ) : scanResult ? (
            scanResult.success ? (
              <div style={{ width: '100%' }}>
                <Result
                  status="success"
                  title="Access Granted"
                  subTitle={`Welcome to the event!`}
                  style={{ padding: 0, marginBottom: 32 }}
                />
                
                <Card type="inner" title="Guest Details" style={{ borderRadius: 12 }}>
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label={<Space><IdcardOutlined /> Card Number</Space>}>
                      <Text strong>{scanResult.card_number}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={<Space><UserOutlined /> Guest Name</Space>}>
                      <Text strong>{scanResult.guest_name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={<Space><CalendarOutlined /> Event Name</Space>}>
                      <Tag color="blue">{scanResult.event_name}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Card Type">
                      <Tag color="gold">{scanResult.card_type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Attendance">
                      <Tag color="green">Marked as Attended</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
                
                <Button 
                  block 
                  size="large" 
                  style={{ marginTop: 24, borderRadius: 8 }} 
                  onClick={() => setScanResult(null)}
                >
                  Clear & Ready for Next
                </Button>
              </div>
            ) : (
              <Result
                status="error"
                title="Access Denied"
                subTitle={scanResult.message}
                extra={[
                  <Button type="primary" key="retry" onClick={() => setScanResult(null)}>
                    Try Again
                  </Button>
                ]}
              />
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#bfbfbf' }}>
              <ScanOutlined style={{ fontSize: 64, marginBottom: 16, opacity: 0.5 }} />
              <Title level={4} style={{ color: '#bfbfbf' }}>Waiting for Scan</Title>
              <Text type="secondary">Scan a QR code to view guest information.</Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QRScanner;
