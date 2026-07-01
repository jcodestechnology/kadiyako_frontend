import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Space, Button, Result, Descriptions, Badge, Divider, List, Tag, Alert, Spin, Row, Col } from 'antd';
import { ScanOutlined, CheckCircleFilled, CloseCircleFilled, HistoryOutlined, CameraOutlined, StopOutlined } from '@ant-design/icons';
import { Html5Qrcode } from "html5-qrcode";
import accessApi from '../api/accessApi';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const QRScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

    // Effect to start scanner when isScanning becomes true
    useEffect(() => {
        let html5QrCode = null;

        if (isScanning) {
            // Give React a tiny moment to render the #reader div
            const timer = setTimeout(async () => {
                try {
                    const readerElement = document.getElementById("reader");
                    if (!readerElement) {
                        console.error("Reader element still not found");
                        setIsScanning(false);
                        return;
                    }

                    html5QrCode = new Html5Qrcode("reader");
                    scannerRef.current = html5QrCode;
                    
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 }
                        },
                        (decodedText) => {
                            stopScanner();
                            handleVerify(decodedText);
                        }
                    );
                } catch (err) {
                    console.error("Scanner start error", err);
                    setIsScanning(false);
                }
            }, 100);

            return () => {
                clearTimeout(timer);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(e => console.log(e));
                }
            };
        }
    }, [isScanning]);

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                await scannerRef.current.clear();
            } catch (err) {
                console.warn("Stop error", err);
            } finally {
                scannerRef.current = null;
                setIsScanning(false);
            }
        }
    };

    const handleVerify = async (cardNumber) => {
        setLoading(true);
        try {
            const res = await accessApi.verifyCard(cardNumber);
            const data = res.data.data;
            
            setScanResult({
                success: true,
                ...data
            });

            setHistory(prev => [{
                id: Date.now(),
                name: data.guest_name,
                event: data.event_name,
                time: dayjs().format('HH:mm:ss'),
                status: 'Authorized'
            }, ...prev].slice(0, 10));

        } catch (err) {
            setScanResult({
                success: false,
                message: err.response?.data?.message || 'Verification failed'
            });
            
            setHistory(prev => [{
                id: Date.now(),
                name: 'Unknown',
                event: 'N/A',
                time: dayjs().format('HH:mm:ss'),
                status: 'Denied'
            }, ...prev].slice(0, 10));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
                    <ScanOutlined style={{ marginRight: 12, color: '#0892d0' }} />
                    Access Verification
                </Title>
                <Text type="secondary">Scan guest card QR codes to verify attendance and view details.</Text>
            </div>

            <Row gutter={[32, 32]}>
                <Col xs={24} lg={10}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card 
                            style={{ 
                                overflow: 'hidden', 
                                borderRadius: 24, 
                                border: 'none', 
                                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                                background: '#fff'
                            }}
                        >
                            <div style={{ position: 'relative', textAlign: 'center', padding: '10px' }}>
                                {!isScanning ? (
                                    <div style={{ padding: '60px 20px', background: '#f8faff', borderRadius: 20, border: '2px dashed #e6edff' }}>
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 16px rgba(8, 146, 208, 0.1)' }}>
                                            <CameraOutlined style={{ fontSize: 32, color: '#0892d0' }} />
                                        </div>
                                        <Title level={4}>Camera Ready</Title>
                                        <Paragraph type="secondary">Point your camera at the guest's QR code to begin verification.</Paragraph>
                                        <div style={{ marginTop: 32 }}>
                                            <Button type="primary" size="large" icon={<ScanOutlined />} onClick={() => setIsScanning(true)} style={{ height: 50, padding: '0 40px', borderRadius: 12, fontWeight: 600, boxShadow: '0 8px 20px rgba(8, 146, 208, 0.2)' }}>
                                                Start Scanning
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <div id="reader" style={{ width: '100%', borderRadius: 20, overflow: 'hidden', border: '4px solid #0892d0' }}></div>
                                        <div className="scanning-line"></div>
                                        <Button danger size="large" style={{ marginTop: 20, borderRadius: 10 }} icon={<StopOutlined />} onClick={stopScanner}>
                                            Stop Scanner
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card 
                            title={<Space><HistoryOutlined style={{ color: '#0892d0' }} /><span>Recent Activity</span></Space>} 
                            style={{ borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: 'none' }}
                        >
                            <List
                                itemLayout="horizontal"
                                dataSource={history}
                                renderItem={item => (
                                    <List.Item extra={<Tag color={item.status === 'Authorized' ? 'success' : 'error'}>{item.status}</Tag>}>
                                        <List.Item.Meta
                                            avatar={item.status === 'Authorized' ? <CheckCircleFilled style={{ color: '#52c41a' }} /> : <CloseCircleFilled style={{ color: '#f5222d' }} />}
                                            title={item.name}
                                            description={`${item.event} • ${item.time}`}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Space>
                </Col>

                <Col xs={24} lg={14}>
                    {loading ? (
                        <Card style={{ borderRadius: 24, textAlign: 'center', padding: '100px 24px' }}>
                            <Spin size="large" />
                            <Title level={3} style={{ marginTop: 32 }}>Verifying Identity...</Title>
                        </Card>
                    ) : scanResult ? (
                        <Card 
                            style={{ 
                                borderRadius: 24, 
                                border: 'none', 
                                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                overflow: 'hidden'
                            }}
                            bodyStyle={{ padding: 0 }}
                        >
                            <div style={{ 
                                background: scanResult.success ? 'linear-gradient(135deg, #52c41a 0%, #237804 100%)' : 'linear-gradient(135deg, #f5222d 0%, #a8071a 100%)',
                                padding: '40px 24px',
                                textAlign: 'center',
                                color: '#fff'
                            }}>
                                {scanResult.success ? <CheckCircleFilled style={{ fontSize: 80, marginBottom: 16 }} /> : <CloseCircleFilled style={{ fontSize: 80, marginBottom: 16 }} />}
                                <Title level={2} style={{ color: '#fff', margin: 0 }}>{scanResult.success ? "ACCESS GRANTED" : "ACCESS DENIED"}</Title>
                                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{scanResult.success ? "Guest verified successfully." : scanResult.message}</Text>
                            </div>

                            {scanResult.success && (
                                <div style={{ padding: '32px' }}>
                                    <Descriptions title="Guest Details" bordered column={1}>
                                        <Descriptions.Item label="Guest Name"><Text strong style={{ fontSize: 18 }}>{scanResult.guest_name}</Text></Descriptions.Item>
                                        <Descriptions.Item label="Event Name">{scanResult.event_name}</Descriptions.Item>
                                        <Descriptions.Item label="Card Type"><Tag color="purple">{scanResult.card_type}</Tag></Descriptions.Item>
                                        <Descriptions.Item label="Card Number"><Text code>{scanResult.card_number}</Text></Descriptions.Item>
                                        <Descriptions.Item label="Status">
                                            {scanResult.already_attended ? (
                                                <Tag color="warning">RE-ENTRY: ALREADY SCANNED AT {dayjs(scanResult.attended_at).format('HH:mm')}</Tag>
                                            ) : (
                                                <Tag color="success">CHECK-IN SUCCESSFUL</Tag>
                                            )}
                                        </Descriptions.Item>
                                    </Descriptions>
                                    <Button type="primary" block size="large" onClick={() => setIsScanning(true)} style={{ marginTop: 24, height: 50, borderRadius: 12 }}>
                                        SCAN NEXT CARD
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card style={{ borderRadius: 24, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafcff', border: '2px dashed #d1d9e6' }}>
                            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <ScanOutlined style={{ fontSize: 80, color: '#d1d9e6', marginBottom: 24 }} />
                                <Title level={3} style={{ color: '#8c98a9' }}>Awaiting Scan...</Title>
                            </div>
                        </Card>
                    )}
                </Col>
            </Row>

            <style>{`
                .scanning-line {
                    position: absolute;
                    width: 100%;
                    height: 2px;
                    background: #0892d0;
                    box-shadow: 0 0 15px 5px rgba(8, 146, 208, 0.5);
                    top: 0;
                    animation: scan 3s linear infinite;
                    z-index: 5;
                }
                @keyframes scan {
                    0% { top: 0% }
                    100% { top: 100% }
                }
                #reader video {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: auto !important;
                    min-height: 300px;
                }
            `}</style>
        </div>
    );
};

export default QRScanner;
