import React, { useState } from 'react';
import { Modal, Upload, message, Button, Typography, Space, Progress } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import contactsApi from '../../api/contactsApi';
import axiosInstance from '../../api/axios';

const { Dragger } = Upload;
const { Text, Paragraph } = Typography;

const ImportModal = ({ visible, onCancel, onSuccess }) => {
  const [fileList, setFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    const hide = message.loading('Generating Excel template...', 0);
    try {
      const response = await contactsApi.getTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'KADIYAKO_Contacts_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Excel template downloaded successfully');
    } catch (error) {
      message.error('Failed to download template');
    } finally {
      hide();
      setDownloading(false);
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a file to import');
      return;
    }

    setImporting(true);
    setUploadProgress(0);
    setImportStatus('Uploading file...');
    try {
      const response = await contactsApi.importContacts(fileList[0].originFileObj, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
        if (percentCompleted === 100) {
          setImportStatus('Queued for processing...');
        }
      });
      
      const { jobId } = response.data.data || response.data;
      if (jobId) {
        const pollProgress = async () => {
          try {
            const res = await axiosInstance.get(`/jobs/${jobId}/progress`);
            const { status, percent, processed, total } = res.data;
            
            if (status === 'processing') {
              setUploadProgress(percent);
              setImportStatus(`Processing: ${processed} / ${total} contacts...`);
              setTimeout(pollProgress, 1500);
            } else if (status === 'completed') {
              setUploadProgress(100);
              setImportStatus('Import completed successfully!');
              message.success('Contacts imported successfully!');
              onSuccess(); // Refresh contact list
              setTimeout(() => setImporting(false), 2000);
            } else if (status === 'failed') {
              setImporting(false);
              message.error('Background processing failed.');
            } else {
              setTimeout(pollProgress, 1500);
            }
          } catch (e) {
            setImporting(false);
          }
        };
        setTimeout(pollProgress, 1000);
      } else {
        message.success('Import started!');
        setFileList([]);
        onSuccess();
        setTimeout(() => setImporting(false), 1000);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Import failed');
      setImporting(false);
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isAllowed = file.type === 'text/csv' || 
                        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        file.type === 'application/vnd.ms-excel' ||
                        file.name.endsWith('.csv') || 
                        file.name.endsWith('.xlsx') || 
                        file.name.endsWith('.xls');
      if (!isAllowed) {
        message.error(`${file.name} is not a supported file type (CSV or Excel)`);
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false;
    },
    fileList,
  };

  return (
    <Modal
      title="Import Contacts"
      open={visible}
      onCancel={onCancel}
      onOk={handleImport}
      okText="Start Import"
      confirmLoading={importing}
      destroyOnClose
    >
      <div style={{ padding: '10px 0' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Paragraph style={{ margin: 0 }}>
            Import contacts from a CSV file. <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>Note: Phone numbers must start with 07 or 06 and be 10 digits.</Text>
          </Paragraph>
          <Button 
            type="link" 
            onClick={handleDownloadTemplate} 
            loading={downloading}
            style={{ padding: 0 }}
          >
            ⬇ Download Excel Template
          </Button>
        </div>
        
        <Dragger {...uploadProps} style={{ padding: '20px', background: '#fafafa', borderRadius: '12px' }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#0892d0' }} />
          </p>
          <p className="ant-upload-text">Click or drag CSV file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single CSV file upload. Maximum size 2MB.
          </p>
        </Dragger>

        {fileList.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileTextOutlined style={{ fontSize: '20px', color: '#0892d0' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{fileList[0].name}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{(fileList[0].size / 1024).toFixed(2)} KB</div>
              </div>
            </div>
            {importing && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={uploadProgress} status="active" strokeColor="#0892d0" />
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{importStatus}</Text>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportModal;
