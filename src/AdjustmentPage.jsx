import { useState, useMemo, useCallback } from 'react';
import {
  Card, Table, Button, Tag, Space, Input, Row, Col, Modal, Descriptions, Timeline, message,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, EyeOutlined,
  HistoryOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getStoredAdjustmentOrders } from './mockData';
import AdjustmentFormPage from './AdjustmentFormPage';
import IterationMark from './demo/IterationMark';

const statusColorMap = {
  '审批通过': 'green',
  '待审批': 'processing',
  '已驳回': 'red',
};

export default function AdjustmentPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [filters, setFilters] = useState({ adjustmentNo: '', relatedBusinessNo: '' });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filteredOrders = useMemo(() => {
    return getStoredAdjustmentOrders().filter((o) => {
      if (filters.adjustmentNo && !o.adjustmentNo.includes(filters.adjustmentNo)) return false;
      if (filters.relatedBusinessNo && !o.relatedBusinessNo.includes(filters.relatedBusinessNo)) return false;
      return true;
    });
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setFilters({ adjustmentNo: '', relatedBusinessNo: '' });
  }, []);

  const handleView = useCallback((record) => {
    setCurrentRecord(record);
    setViewModalVisible(true);
  }, []);

  const handleViewLog = useCallback((record) => {
    setCurrentRecord(record);
    setLogModalVisible(true);
  }, []);

  const handleAdd = useCallback(() => {
    setShowForm(true);
  }, []);

  const columns = [
    {
      title: '调整单号', dataIndex: 'adjustmentNo', key: 'adjustmentNo', width: 180,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '调整项目', dataIndex: 'adjustmentItem', key: 'adjustmentItem', width: 140,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center',
      render: (v) => <Tag color={statusColorMap[v]}>{v}</Tag>,
    },
    {
      title: '关联业务单号', dataIndex: 'relatedBusinessNo', key: 'relatedBusinessNo', width: 220,
      render: (text) => <a>{text}</a>,
    },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 130 },
    { title: '申请时间', dataIndex: 'applicationTime', key: 'applicationTime', width: 180 },
    {
      title: '审批通过时间', dataIndex: 'approvalTime', key: 'approvalTime', width: 180,
      render: (v) => v || '-',
    },
    {
      title: '审批单号', dataIndex: 'approvalNo', key: 'approvalNo', width: 220,
      render: (v) => v || '-',
    },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewLog(record)}>日志</Button>
        </Space>
      ),
    },
  ];

  const logTimelineItems = currentRecord ? [
    { color: 'green', children: `${currentRecord.applicationTime}  ${currentRecord.applicant} 提交调整单` },
    ...(currentRecord.status === '审批通过' ? [{
      color: 'green', children: `${currentRecord.approvalTime}  系统自动审批通过`,
    }] : currentRecord.status === '已驳回' ? [{
      color: 'red', children: `审批驳回，原因：信息不完整`,
    }] : [{
      color: 'blue', children: '等待审批中',
    }]),
  ] : [];

  if (showForm) {
    return <AdjustmentFormPage onBack={() => setShowForm(false)} />;
  }

  return (
    <div className="adj-page">
      <IterationMark mark="adjustment-list">
        {contextHolder}
        {/* Filter Area */}
        <Card className="filter-card" size="small">
          <Row gutter={[12, 12]} align="middle">
            <Col span={5}>
              <Input
                placeholder="请输入调整单号" prefix={<SearchOutlined />}
                value={filters.adjustmentNo}
                onChange={(e) => setFilters({ ...filters, adjustmentNo: e.target.value })}
                allowClear
              />
            </Col>
            <Col span={5}>
              <Input
                placeholder="请输入关联业务单号" prefix={<SearchOutlined />}
                value={filters.relatedBusinessNo}
                onChange={(e) => setFilters({ ...filters, relatedBusinessNo: e.target.value })}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />}>筛选</Button>
                <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>重置</Button>
              </Space>
            </Col>
            <Col span={10} style={{ textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card
          title={
            <Space>
              <span>调整单列表</span>
              <Tag color="blue">{filteredOrders.length} 条</Tag>
            </Space>
          }
          size="small"
          className="adj-table-card"
        >
          <Table
            dataSource={filteredOrders}
            columns={columns}
            rowKey="id"
            size="middle"
            scroll={{ x: 1400, y: 600 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
              pageSizeOptions: [10, 20, 50],
            }}
            bordered
          />
        </Card>

        {/* View Detail Modal */}
        <Modal
          title={`调整单详情 - ${currentRecord?.adjustmentNo || ''}`}
          open={viewModalVisible}
          onCancel={() => { setViewModalVisible(false); setCurrentRecord(null); }}
          footer={<Button onClick={() => { setViewModalVisible(false); setCurrentRecord(null); }}>关闭</Button>}
          width={640}
        >
          {currentRecord && (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="调整单号">{currentRecord.adjustmentNo}</Descriptions.Item>
              <Descriptions.Item label="调整项目"><Tag color="blue">{currentRecord.adjustmentItem}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColorMap[currentRecord.status]}>{currentRecord.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="关联业务单号">{currentRecord.relatedBusinessNo}</Descriptions.Item>
              <Descriptions.Item label="申请人">{currentRecord.applicant}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{currentRecord.applicationTime}</Descriptions.Item>
              <Descriptions.Item label="审批通过时间">{currentRecord.approvalTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批单号">{currentRecord.approvalNo || '-'}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* Log Modal */}
        <Modal
          title={`操作日志 - ${currentRecord?.adjustmentNo || ''}`}
          open={logModalVisible}
          onCancel={() => { setLogModalVisible(false); setCurrentRecord(null); }}
          footer={<Button onClick={() => { setLogModalVisible(false); setCurrentRecord(null); }}>关闭</Button>}
          width={560}
        >
          {currentRecord && <Timeline items={logTimelineItems} />}
        </Modal>
      </IterationMark>
    </div>
  );
}
