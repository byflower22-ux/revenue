import { useState, useMemo, useCallback } from 'react';
import {
  Layout, Menu, Table, Tabs, Button, Tag, Space, Input, Select, DatePicker,
  Breadcrumb, Card, Descriptions, Timeline, Modal, Form, InputNumber,
  message, Divider, Badge, Tooltip, Popconfirm, Row, Col, Statistic,
} from 'antd';
import {
  DashboardOutlined, SettingOutlined, AccountBookOutlined,
  OrderedListOutlined, MoneyCollectOutlined, SwapOutlined,
  FileTextOutlined, HistoryOutlined, EditOutlined, PlusOutlined,
  SearchOutlined, ReloadOutlined, ExportOutlined, DownOutlined,
  UpOutlined, HomeOutlined, FolderOutlined, TeamOutlined,
  UnorderedListOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  orders, payments, deliveries, ruleVersions, ruleSnapshots,
  calculateRevenues, adjustments, addAdjustment,
  getStoredOrders, getStoredAdjustments,
} from './mockData';
import OrderDetailPage from './OrderDetailPage';
import AdjustmentPage from './AdjustmentPage';
import './App.css';
import DemoToggle from './demo/DemoToggle';
import DocDrawer from './demo/DocDrawer';
import IterationMark from './demo/IterationMark';
import DemoAdminPage from './demo/DemoAdminPage';
import { useDemo } from './demo/DemoProvider';
import './demo/demo.css';

const { Sider, Content } = Layout;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const statusColorMap = {
  '已完成': 'green',
  '已支付': 'blue',
  '待交付': 'orange',
  '已取消': 'red',
  '生效中': 'green',
  '已失效': 'default',
};

const revenueTypeColorMap = {
  '业务收入': '#1890ff',
  '导流收入': '#52c41a',
  '交付收入': '#722ed1',
  '渠道分成': '#fa8c16',
};

const breadcrumbMap = {
  'analysis': { parent: '', label: '经营分析' },
  'rule-config': { parent: '规则管理', label: '规则配置' },
  'rule-detail': { parent: '规则管理', label: '规则明细' },
  'cost-item': { parent: '核算中心', label: '收入成本项管理' },
  'revenue': { parent: '核算中心', label: '收入核算' },
  'cost': { parent: '核算中心', label: '成本核算' },
  'order-detail': { parent: '核算中心', label: '订单详情' },
  'adjustment': { parent: '核算中心', label: '调整单' },
  'order-accounting': { parent: '核算中心', label: '订单核算管理' },
};

export default function App() {
  const { demoMode } = useDemo();
  const [selectedMenu, setSelectedMenu] = useState('revenue');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('business');
  const [detailTab, setDetailTab] = useState('revenue');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustType, setAdjustType] = useState('rule'); // 'rule' | 'revenue'
  const [adjustForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Filters for revenue page
  const [filters, setFilters] = useState({
    orderNo: '', team: '', teamRegion: '', productType: '',
    department: '', employee: '', buyer: '', activityType: '',
    product: '', dateRange: null,
  });

  // Filters for order accounting page
  const [oaFilters, setOaFilters] = useState({
    orderNo: '', orderType: '', status: '', dateRange: null,
    buyer: '', product: '', productType: '', buyerSource: '',
    ruleName: '', ruleId: '', ruleVersion: '',
  });
  const [oaFilterExpanded, setOaFilterExpanded] = useState(false);

  // Filtered orders for revenue page
  const filteredOrders = useMemo(() => {
    return getStoredOrders().filter((o) => {
      if (filters.orderNo && !o.orderNo.includes(filters.orderNo)) return false;
      if (filters.team && filters.team !== '全部' && o.team !== filters.team) return false;
      if (filters.teamRegion && filters.teamRegion !== '全部' && o.teamRegion !== filters.teamRegion) return false;
      if (filters.productType && filters.productType !== '全部' && o.productType !== filters.productType) return false;
      if (filters.department && filters.department !== '全部' && o.department !== filters.department) return false;
      if (filters.employee && !o.employee.includes(filters.employee)) return false;
      if (filters.buyer && !o.buyer.includes(filters.buyer)) return false;
      if (filters.product && !o.product.includes(filters.product)) return false;
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const t = dayjs(o.createTime);
        if (t.isBefore(start) || t.isAfter(end)) return false;
      }
      if (activeTab === 'business') return true;
      return true;
    });
  }, [filters, activeTab]);

  // Filtered orders for order accounting page
  const oaFilteredOrders = useMemo(() => {
    return getStoredOrders().filter((o) => {
      if (oaFilters.orderNo && !o.orderNo.includes(oaFilters.orderNo)) return false;
      if (oaFilters.orderType && o.orderType !== oaFilters.orderType) return false;
      if (oaFilters.status && o.status !== oaFilters.status) return false;
      if (oaFilters.buyer && !o.buyer.includes(oaFilters.buyer)) return false;
      if (oaFilters.product && !o.product.includes(oaFilters.product)) return false;
      if (oaFilters.productType && o.productType !== oaFilters.productType) return false;
      if (oaFilters.buyerSource && o.buyerSource !== oaFilters.buyerSource) return false;
      if (oaFilters.ruleName) {
        const rule = ruleVersions.find(rv => rv.id === o.matchedRuleId);
        if (!rule || !rule.name.includes(oaFilters.ruleName)) return false;
      }
      if (oaFilters.ruleId && o.matchedRuleId !== oaFilters.ruleId) return false;
      if (oaFilters.ruleVersion && o.matchedRuleVersion !== oaFilters.ruleVersion) return false;
      if (oaFilters.dateRange) {
        const [start, end] = oaFilters.dateRange;
        const t = dayjs(o.createTime);
        if (t.isBefore(start) || t.isAfter(end)) return false;
      }
      return true;
    });
  }, [oaFilters]);

  // Order accounting summary
  const oaSummary = useMemo(() => {
    let totalConfirmed = 0;
    let totalUnconfirmed = 0;
    oaFilteredOrders.forEach((o) => {
      const revenues = calculateRevenues(o);
      const confirmed = revenues.reduce((sum, r) => sum + r.amount, 0);
      totalConfirmed += confirmed;
      totalUnconfirmed += Math.max(0, (o.actualPayAmount || 0) - confirmed);
    });
    return { total: oaFilteredOrders.length, totalConfirmed, totalUnconfirmed };
  }, [oaFilteredOrders]);

  // Selected order detail data
  const selectedOrderDetail = useMemo(() => {
    if (!selectedOrder) return null;
    const order = getStoredOrders().find((o) => o.orderNo === selectedOrder);
    if (!order) return null;

    const orderPayments = payments.filter((p) => p.orderNo === order.orderNo);
    const orderDeliveries = deliveries.filter((d) => d.orderNo === order.orderNo);
    const orderRevenues = calculateRevenues(order);
    const snapshot = ruleSnapshots.find((s) => s.orderNo === order.orderNo);
    const matchedRule = ruleVersions.find((rv) => rv.id === order.matchedRuleId);
    const orderAdjustments = getStoredAdjustments().filter((a) => a.orderNo === order.orderNo);

    return { order, orderPayments, orderDeliveries, orderRevenues, snapshot, matchedRule, orderAdjustments };
  }, [selectedOrder]);

  const handleSelectOrder = useCallback((orderNo) => {
    setSelectedOrder(orderNo);
    setDetailTab('revenue');
  }, []);

  const handleViewOrderDetail = useCallback((orderNo) => {
    setSelectedOrderId(orderNo);
    setSelectedMenu('order-detail');
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedMenu('order-accounting');
    setSelectedOrderId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      orderNo: '', team: '', teamRegion: '', productType: '',
      department: '', employee: '', buyer: '', activityType: '',
      product: '', dateRange: null,
    });
  }, []);

  const handleResetOaFilters = useCallback(() => {
    setOaFilters({ orderNo: '', orderType: '', status: '', dateRange: null, buyer: '', product: '', productType: '', buyerSource: '', ruleName: '', ruleId: '', ruleVersion: '' });
  }, []);

  const handleAdjust = useCallback((type) => {
    setAdjustType(type);
    adjustForm.resetFields();
    setAdjustModalVisible(true);
  }, [adjustForm]);

  const handleAdjustSubmit = useCallback(() => {
    adjustForm.validateFields().then((values) => {
      if (!selectedOrder) return;
      addAdjustment({
        orderNo: selectedOrder,
        type: adjustType === 'rule' ? '规则调整' : '收入调整',
        reason: values.reason,
        details: values,
        operator: '当前用户',
      });
      messageApi.success(`${adjustType === 'rule' ? '规则调整' : '收入调整'}已提交`);
      setAdjustModalVisible(false);
      adjustForm.resetFields();
    });
  }, [adjustForm, adjustType, selectedOrder, messageApi]);

  // ========== Order List Columns (Revenue Page) ==========
  const orderColumns = [
    {
      title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 150, fixed: 'left',
      render: (text, record) => (
        <a className={selectedOrder === text ? 'order-link active' : 'order-link'} onClick={() => handleSelectOrder(text)}>{text}</a>
      ),
    },
    { title: '订单类型', dataIndex: 'orderType', key: 'orderType', width: 100 },
    { title: '产品信息', dataIndex: 'product', key: 'product', width: 200, ellipsis: true },
    { title: '产品类型', dataIndex: 'productType', key: 'productType', width: 80 },
    { title: '买家姓名', dataIndex: 'buyer', key: 'buyer', width: 90 },
    { title: '客户来源', dataIndex: 'buyerSource', key: 'buyerSource', width: 100 },
    { title: '所属团队', dataIndex: 'team', key: 'team', width: 120 },
    { title: '员工', dataIndex: 'employee', key: 'employee', width: 80 },
    {
      title: '订单金额', dataIndex: 'amount', key: 'amount', width: 110, align: 'right',
      render: (v) => <span style={{ fontWeight: 600 }}>¥{v.toLocaleString()}</span>,
    },
    {
      title: '匹配规则', dataIndex: 'matchedRuleVersion', key: 'matchedRuleVersion', width: 100, align: 'center',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '订单状态', dataIndex: 'status', key: 'status', width: 90, align: 'center',
      render: (v) => <Tag color={statusColorMap[v]}>{v}</Tag>,
    },
    { title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    {
      title: '操作', key: 'action', width: 120, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => handleSelectOrder(record.orderNo)}><EditOutlined /> 详情</a>
          <a onClick={() => { handleSelectOrder(record.orderNo); setDetailTab('snapshot'); }}><HistoryOutlined /> 日志</a>
        </Space>
      ),
    },
  ];

  // ========== Revenue Table Columns ==========
  const revenueColumns = [
    { title: '收入类型', dataIndex: 'type', key: 'type', width: 100, render: (v) => <Tag color={revenueTypeColorMap[v]}>{v}</Tag> },
    { title: '触发方式', dataIndex: 'trigger', key: 'trigger', width: 80, render: (v) => v === '支付' ? <Badge status="processing" text="支付触发" /> : <Badge status="warning" text="交付触发" /> },
    { title: '收入金额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right', render: (v) => <span style={{ fontWeight: 600, color: '#f5222d' }}>¥{v.toLocaleString()}</span> },
    { title: '分配比例', dataIndex: 'ratio', key: 'ratio', width: 100, align: 'center', render: (v) => `${(v * 100).toFixed(0)}%` },
    { title: '归属团队', dataIndex: 'team', key: 'team', width: 130 },
    { title: '匹配规则', dataIndex: 'ruleVersion', key: 'ruleVersion', width: 90, align: 'center', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '确认时间', dataIndex: 'confirmTime', key: 'confirmTime', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, align: 'center', render: (v) => <Tag color="green">{v}</Tag> },
  ];

  // ========== Order Accounting Columns ==========
  const orderAccountingColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160, fixed: 'left' },
    { title: '订单类型', dataIndex: 'orderType', key: 'orderType', width: 100,
      filters: [...new Set(orders.map(o => o.orderType))].map(v => ({ text: v, value: v })),
      onFilter: (value, record) => record.orderType === value,
    },
    { title: '买家姓名', dataIndex: 'buyer', key: 'buyer', width: 100 },
    { title: '买家编号', dataIndex: 'buyerNo', key: 'buyerNo', width: 110 },
    { title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    { title: '支付完成时间', dataIndex: 'payTime', key: 'payTime', width: 170, render: (v) => v || '-' },
    { title: '产品信息/活动信息', dataIndex: 'product', key: 'product', width: 200, ellipsis: true },
    { title: '产品类型', dataIndex: 'productType', key: 'productType', width: 100 },
    { title: '下单时客户负责人', dataIndex: 'employee', key: 'employee', width: 150 },
    { title: '下单时客户负责人所属团队', dataIndex: 'team', key: 'team', width: 200 },
    { title: '活动邀约人', dataIndex: 'activityInviter', key: 'activityInviter', width: 110, render: (v) => v || '-' },
    { title: '活动邀约人所属团队', dataIndex: 'activityInviterTeam', key: 'activityInviterTeam', width: 160, render: (v) => v || '-' },
    { title: '活动邀约人所属团队类型', dataIndex: 'activityInviterTeamType', key: 'activityInviterTeamType', width: 180, render: (v) => v || '-' },
    { title: '产品归属', dataIndex: 'productAttribution', key: 'productAttribution', width: 130 },
    { title: '客户来源', dataIndex: 'buyerSource', key: 'buyerSource', width: 110 },
    { title: '客户购买阶段', dataIndex: 'purchaseStage', key: 'purchaseStage', width: 120 },
    { title: '博商咨询产品客户购买阶段', dataIndex: 'bsPurchaseStage', key: 'bsPurchaseStage', width: 220 },
    { title: '成交方式', dataIndex: 'tradeMethod', key: 'tradeMethod', width: 110 },
    { title: '活动主办方', dataIndex: 'activityOrganizer', key: 'activityOrganizer', width: 120, render: (v) => v || '-' },
    { title: '活动类型', dataIndex: 'activityType', key: 'activityType', width: 130, render: (v) => v || '-' },
    { title: '部门', dataIndex: 'department', key: 'department', width: 120 },
    {
      title: '收入扣除比例', dataIndex: 'deductionRatio', key: 'deductionRatio', width: 130, align: 'center',
      render: (v) => v ? <span>{(v * 100).toFixed(0)}%</span> : '-',
    },
    {
      title: '收入扣除金额', dataIndex: 'deductionAmount', key: 'deductionAmount', width: 130, align: 'right',
      render: (v) => v > 0 ? <span style={{ color: '#f5222d' }}>¥{v.toLocaleString()}</span> : '-',
    },
    {
      title: '当前规则名称', key: 'ruleName', width: 200,
      render: (_, record) => {
        const rule = ruleVersions.find(rv => rv.id === record.matchedRuleId);
        return rule ? rule.name : '-';
      },
    },
    {
      title: '规则编码', key: 'ruleId', width: 100,
      render: (_, record) => record.matchedRuleId || '-',
    },
    {
      title: '规则版本', key: 'ruleVersion', width: 100,
      render: (_, record) => record.matchedRuleVersion || '-',
    },
    {
      title: '订单状态', dataIndex: 'status', key: 'status', width: 110, align: 'center',
      filters: [...new Set(orders.map(o => o.status))].map(v => ({ text: v, value: v })),
      onFilter: (value, record) => record.status === value,
      render: (v) => <Tag color={statusColorMap[v]}>{v}</Tag>,
    },
    {
      title: '实付金额', dataIndex: 'actualPayAmount', key: 'actualPayAmount', width: 130, align: 'right',
      render: (v) => <span style={{ fontWeight: 600 }}>¥{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '退款金额', dataIndex: 'refundAmount', key: 'refundAmount', width: 120, align: 'right',
      render: (v) => v > 0 ? <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{v.toLocaleString()}</span> : '-',
    },
    {
      title: '业务收入1比例', key: 'biz1Ratio', width: 130, align: 'center',
      render: (_, record) => {
        const rule = ruleVersions.find((rv) => rv.version === record.matchedRuleVersion);
        if (!rule || rule.rules.business1Ratio == null) return '-';
        return <Tag color="blue">{(rule.rules.business1Ratio * 100).toFixed(0)}%</Tag>;
      },
    },
    {
      title: '业务收入2比例', key: 'biz2Ratio', width: 130, align: 'center',
      render: (_, record) => {
        const rule = ruleVersions.find((rv) => rv.version === record.matchedRuleVersion);
        if (!rule || rule.rules.business2Ratio == null) return '-';
        return <Tag color="blue">{(rule.rules.business2Ratio * 100).toFixed(0)}%</Tag>;
      },
    },
    {
      title: '导流收入比例', key: 'trafficRatio', width: 130, align: 'center',
      render: (_, record) => {
        const rule = ruleVersions.find((rv) => rv.version === record.matchedRuleVersion);
        if (!rule || rule.rules.trafficRatio == null) return '-';
        return <Tag color="green">{(rule.rules.trafficRatio * 100).toFixed(0)}%</Tag>;
      },
    },
    {
      title: '交付收入比例', key: 'deliveryRatio', width: 130, align: 'center',
      render: (_, record) => {
        const rule = ruleVersions.find((rv) => rv.version === record.matchedRuleVersion);
        if (!rule || rule.rules.deliveryRatio == null) return '-';
        return <Tag color="purple">{(rule.rules.deliveryRatio * 100).toFixed(0)}%</Tag>;
      },
    },
    {
      title: '渠道分成比例', key: 'channelRatio', width: 130, align: 'center',
      render: (_, record) => {
        const rule = ruleVersions.find((rv) => rv.version === record.matchedRuleVersion);
        if (!rule || rule.rules.channelRatio == null) return '-';
        return <Tag color="orange">{(rule.rules.channelRatio * 100).toFixed(0)}%</Tag>;
      },
    },
    {
      title: '应确认收入金额', key: 'toBeConfirmed', width: 150,
      render: (_, record) => {
        const amount = record.actualPayAmount - (record.refundAmount || 0);
        return <span style={{ fontWeight: 500 }}>¥{amount.toLocaleString()}</span>;
      },
    },
    {
      title: '已确认收入', key: 'confirmedRevenue', width: 140, align: 'right', fixed: 'right',
      render: (_, record) => {
        const revenues = calculateRevenues(record);
        const total = revenues.reduce((sum, r) => sum + r.amount, 0);
        return <span style={{ fontWeight: 700, color: '#52c41a', fontSize: 14 }}>¥{total.toLocaleString()}</span>;
      },
    },
    {
      title: '未确认收入', key: 'unconfirmedRevenue', width: 140, align: 'right', fixed: 'right',
      render: (_, record) => {
        const revenues = calculateRevenues(record);
        const confirmed = revenues.reduce((sum, r) => sum + r.amount, 0);
        const unconfirmed = Math.max(0, (record.actualPayAmount || 0) - confirmed);
        return <span style={{ fontWeight: 700, color: unconfirmed > 0 ? '#faad14' : '#8c8c8c', fontSize: 14 }}>¥{unconfirmed.toLocaleString()}</span>;
      },
    },
    {
      title: '操作', key: 'action', width: 110, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleViewOrderDetail(record.orderNo)}>
          查看详情
        </Button>
      ),
    },
  ];

  // ========== Sidebar Menu ==========
  const sideMenuItems = [
    { key: 'analysis', icon: <DashboardOutlined />, label: '经营分析' },
    {
      key: 'rules', icon: <SettingOutlined />, label: '规则管理',
      children: [
        { key: 'rule-config', label: '规则配置' },
        { key: 'rule-detail', label: '规则明细' },
      ],
    },
    {
      key: 'accounting', icon: <AccountBookOutlined />, label: '核算中心',
      children: [
        { key: 'cost-item', label: '收入成本项管理' },
        { key: 'order-accounting', label: '订单核算管理' },
        { key: 'revenue', label: '收入核算' },
        { key: 'cost', label: '成本核算' },
        { key: 'adjustment', label: '调整单' },
      ],
    },
    ...(demoMode ? [{ key: 'demo-admin', icon: <SettingOutlined />, label: '演示配置' }] : []),
  ];

  const currentBreadcrumb = breadcrumbMap[selectedMenu] || { parent: '', label: '' };

  // ========== Render ==========
  return (
    <Layout className="app-layout">
      {contextHolder}
      {/* ====== Sidebar ====== */}
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        width={220}
        className="app-sider"
        trigger={null}
      >
        <div className="sider-logo">
          <MoneyCollectOutlined style={{ fontSize: 22, color: '#3b82f6' }} />
          {!sidebarCollapsed && <span className="sider-logo-text">财务分润系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={['accounting']}
          selectedKeys={[selectedMenu === 'order-detail' ? 'order-accounting' : selectedMenu]}
          onSelect={({ key }) => { setSelectedMenu(key); setSelectedOrder(null); }}
          items={sideMenuItems}
          className="sider-menu"
        />
      </Sider>

      {/* ====== Main Content ====== */}
      <Layout className="app-content-layout">
        {/* Top Bar */}
        <div className="top-bar">
          <Breadcrumb items={[
            { title: <><HomeOutlined /> 首页</> },
            ...(currentBreadcrumb.parent ? [{ title: currentBreadcrumb.parent }] : []),
            { title: <span style={{ color: '#1890ff' }}>{currentBreadcrumb.label}</span> },
          ]} />
          <div className="top-bar-right">
            <Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined />} /></Tooltip>
            <Tooltip title="全屏"><Button type="text" icon={<DashboardOutlined />} /></Tooltip>
            <div className="top-bar-avatar">U</div>
          </div>
        </div>

        <Content className="app-content">
          {/* ====== Revenue Page ====== */}
          {selectedMenu === 'revenue' && (
            <>
              {/* Filter Area */}
              <Card className="filter-card" size="small">
                <IterationMark mark="revenue-filter">
                <Row gutter={[12, 12]} align="middle">
                  <Col span={4}>
                    <Input
                      placeholder="订单号" prefix={<SearchOutlined />}
                      value={filters.orderNo}
                      onChange={(e) => setFilters({ ...filters, orderNo: e.target.value })}
                      allowClear size="middle"
                    />
                  </Col>
                  <Col span={3}>
                    <Select placeholder="所属团队" style={{ width: '100%' }} value={filters.team || undefined}
                      onChange={(v) => setFilters({ ...filters, team: v })} allowClear
                      options={[{ value: '全部', label: '全部' }, { value: '特训营业务组', label: '特训营业务组' }, { value: '导流运营组', label: '导流运营组' }, { value: '交付服务组', label: '交付服务组' }, { value: '渠道合作组', label: '渠道合作组' }]}
                    />
                  </Col>
                  <Col span={3}>
                    <Select placeholder="团队区域" style={{ width: '100%' }} value={filters.teamRegion || undefined}
                      onChange={(v) => setFilters({ ...filters, teamRegion: v })} allowClear
                      options={[{ value: '全部', label: '全部' }, { value: '华东区', label: '华东区' }, { value: '华北区', label: '华北区' }, { value: '华南区', label: '华南区' }]}
                    />
                  </Col>
                  <Col span={4}>
                    <Select placeholder="产品类型" style={{ width: '100%' }} value={filters.productType || undefined}
                      onChange={(v) => setFilters({ ...filters, productType: v })} allowClear
                      options={[{ value: '全部', label: '全部' }, { value: '课程', label: '课程' }, { value: '活动', label: '活动' }, { value: '会员', label: '会员' }]}
                    />
                  </Col>
                  <Col span={3}>
                    <Input placeholder="员工姓名" value={filters.employee}
                      onChange={(e) => setFilters({ ...filters, employee: e.target.value })} allowClear
                    />
                  </Col>
                  <Col span={4}>
                    <Input placeholder="买家姓名" value={filters.buyer}
                      onChange={(e) => setFilters({ ...filters, buyer: e.target.value })} allowClear
                    />
                  </Col>
                  <Col span={4}>
                    <Space>
                      <Button type="primary" icon={<SearchOutlined />}>筛选</Button>
                      <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>重置</Button>
                      <Button type="link" onClick={() => setFilterCollapsed(!filterCollapsed)}>
                        {filterCollapsed ? '展开' : '收起'}
                        {filterCollapsed ? <DownOutlined /> : <UpOutlined />}
                      </Button>
                    </Space>
                  </Col>
                </Row>
                </IterationMark>
                {!filterCollapsed && (
                  <Row gutter={[12, 12]} style={{ marginTop: 12 }} align="middle">
                    <Col span={5}>
                      <Input placeholder="产品搜索" value={filters.product}
                        onChange={(e) => setFilters({ ...filters, product: e.target.value })} allowClear
                      />
                    </Col>
                    <Col span={3}>
                      <Select placeholder="所属部门" style={{ width: '100%' }} value={filters.department || undefined}
                        onChange={(v) => setFilters({ ...filters, department: v })} allowClear
                        options={[{ value: '全部', label: '全部' }, { value: '教育培训部', label: '教育培训部' }, { value: '市场部', label: '市场部' }, { value: '会员运营部', label: '会员运营部' }]}
                      />
                    </Col>
                    <Col span={7}>
                      <RangePicker
                        style={{ width: '100%' }}
                        value={filters.dateRange}
                        onChange={(v) => setFilters({ ...filters, dateRange: v })}
                        placeholder={['开始时间', '结束时间']}
                      />
                    </Col>
                    <Col span={3}>
                      <Button icon={<ExportOutlined />}>导出</Button>
                    </Col>
                  </Row>
                )}
              </Card>

              {/* Main Body: Order List + Detail */}
              <IterationMark mark="revenue-list-detail">
              <div className="main-body">
                {/* Left: Order Table */}
                <div className={`order-list-panel ${selectedOrder ? 'has-detail' : ''}`}>
                  <Card
                    title={
                      <Space>
                        <OrderedListOutlined />
                        <span>订单列表</span>
                        <Tag color="blue">{filteredOrders.length} 条</Tag>
                      </Space>
                    }
                    size="small"
                    className="order-list-card"
                  >
                    <Tabs activeKey={activeTab} onChange={setActiveTab} size="small" className="revenue-tabs">
                      <TabPane tab="业务收入" key="business" />
                      <TabPane tab="导流收入" key="traffic" />
                      <TabPane tab="交付收入" key="delivery" />
                    </Tabs>
                    <Table
                      dataSource={filteredOrders}
                      columns={orderColumns}
                      rowKey="orderNo"
                      size="small"
                      scroll={{ x: 1700, y: 500 }}
                      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
                      onRow={(record) => ({
                        onClick: () => handleSelectOrder(record.orderNo),
                        className: selectedOrder === record.orderNo ? 'selected-row' : '',
                      })}
                    />
                  </Card>
                </div>

                {/* Right: Order Detail */}
                {selectedOrder && selectedOrderDetail && (
                  <div className="detail-panel">
                    <Card
                      title={
                        <Space>
                          <FileTextOutlined />
                          <span>订单详情 - {selectedOrder}</span>
                          <Tag color={statusColorMap[selectedOrderDetail.order.status]}>
                            {selectedOrderDetail.order.status}
                          </Tag>
                          <Tag color="blue">规则 {selectedOrderDetail.order.matchedRuleVersion}</Tag>
                        </Space>
                      }
                      extra={
                        <Space>
                          <Button type="primary" size="small" icon={<SwapOutlined />} onClick={() => handleAdjust('rule')}>
                            规则调整
                          </Button>
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleAdjust('revenue')}>
                            收入调整
                          </Button>
                          <Button size="small" type="text" onClick={() => setSelectedOrder(null)}>
                            关闭
                          </Button>
                        </Space>
                      }
                      size="small"
                      className="detail-card"
                    >
                      {/* Order Summary */}
                      <Descriptions bordered size="small" column={4} className="order-desc">
                        <Descriptions.Item label="订单号">{selectedOrderDetail.order.orderNo}</Descriptions.Item>
                        <Descriptions.Item label="订单类型">{selectedOrderDetail.order.orderType}</Descriptions.Item>
                        <Descriptions.Item label="产品">{selectedOrderDetail.order.product}</Descriptions.Item>
                        <Descriptions.Item label="订单金额">
                          <span style={{ fontWeight: 700, color: '#f5222d', fontSize: 16 }}>
                            ¥{selectedOrderDetail.order.amount.toLocaleString()}
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="买家">{selectedOrderDetail.order.buyer} ({selectedOrderDetail.order.buyerNo})</Descriptions.Item>
                        <Descriptions.Item label="客户来源">{selectedOrderDetail.order.buyerSource}</Descriptions.Item>
                        <Descriptions.Item label="购买阶段">{selectedOrderDetail.order.purchaseStage}</Descriptions.Item>
                        <Descriptions.Item label="成交方式">{selectedOrderDetail.order.tradeMethod}</Descriptions.Item>
                        <Descriptions.Item label="所属团队">{selectedOrderDetail.order.team}</Descriptions.Item>
                        <Descriptions.Item label="团队区域">{selectedOrderDetail.order.teamRegion}</Descriptions.Item>
                        <Descriptions.Item label="负责员工">{selectedOrderDetail.order.employee}</Descriptions.Item>
                        <Descriptions.Item label="所属部门">{selectedOrderDetail.order.department}</Descriptions.Item>
                        <Descriptions.Item label="下单时间">{selectedOrderDetail.order.createTime}</Descriptions.Item>
                        <Descriptions.Item label="支付时间">{selectedOrderDetail.order.payTime || '-'}</Descriptions.Item>
                        <Descriptions.Item label="交付时间">{selectedOrderDetail.order.deliveryTime || '-'}</Descriptions.Item>
                        <Descriptions.Item label="收入确认">{selectedOrderDetail.order.revenueConfirmTime || '-'}</Descriptions.Item>
                      </Descriptions>

                      {/* Revenue Summary Stats */}
                      <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
                        <Col span={6}>
                          <Statistic
                            title="业务收入"
                            value={selectedOrderDetail.orderRevenues.find(r => r.type === '业务收入')?.amount || 0}
                            prefix="¥"
                            valueStyle={{ color: '#1890ff', fontSize: 18 }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="导流收入"
                            value={selectedOrderDetail.orderRevenues.find(r => r.type === '导流收入')?.amount || 0}
                            prefix="¥"
                            valueStyle={{ color: '#52c41a', fontSize: 18 }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="交付收入"
                            value={selectedOrderDetail.orderRevenues.find(r => r.type === '交付收入')?.amount || 0}
                            prefix="¥"
                            valueStyle={{ color: '#722ed1', fontSize: 18 }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="渠道分成"
                            value={selectedOrderDetail.orderRevenues.find(r => r.type === '渠道分成')?.amount || 0}
                            prefix="¥"
                            valueStyle={{ color: '#fa8c16', fontSize: 18 }}
                          />
                        </Col>
                      </Row>

                      <Divider style={{ margin: '12px 0' }} />

                      {/* Detail Tabs */}
                      <Tabs activeKey={detailTab} onChange={setDetailTab} size="small">
                        {/* Tab: Revenue Flows */}
                        <TabPane
                          tab={<span><MoneyCollectOutlined /> 收入流水</span>}
                          key="revenue"
                        >
                          <Table
                            dataSource={selectedOrderDetail.orderRevenues}
                            columns={revenueColumns}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            bordered
                            summary={(data) => {
                              const total = data.reduce((sum, r) => sum + r.amount, 0);
                              return (
                                <Table.Summary.Row>
                                  <Table.Summary.Cell index={0} colSpan={2}><strong>合计</strong></Table.Summary.Cell>
                                  <Table.Summary.Cell index={2} align="right">
                                    <strong style={{ color: '#f5222d' }}>¥{total.toLocaleString()}</strong>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3} colSpan={5} />
                                </Table.Summary.Row>
                              );
                            }}
                          />

                          {/* Payment & Delivery records */}
                          <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={12}>
                              <Card title="支付记录" size="small" className="sub-card">
                                {selectedOrderDetail.orderPayments.length > 0 ? (
                                  selectedOrderDetail.orderPayments.map((p) => (
                                    <div key={p.id} className="record-item">
                                      <Space>
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                        <span>¥{p.amount.toLocaleString()}</span>
                                        <Tag>{p.payMethod}</Tag>
                                        <span className="record-time">{p.payTime}</span>
                                      </Space>
                                    </div>
                                  ))
                                ) : <div className="empty-text">暂无支付记录</div>}
                              </Card>
                            </Col>
                            <Col span={12}>
                              <Card title="交付记录" size="small" className="sub-card">
                                {selectedOrderDetail.orderDeliveries.length > 0 ? (
                                  selectedOrderDetail.orderDeliveries.map((d) => (
                                    <div key={d.id} className="record-item">
                                      <Space>
                                        <CheckCircleOutlined style={{ color: '#722ed1' }} />
                                        <span>{d.content}</span>
                                        <Tag color="green">{d.status}</Tag>
                                        <span className="record-time">{d.deliveryTime}</span>
                                      </Space>
                                    </div>
                                  ))
                                ) : <div className="empty-text">暂无交付记录</div>}
                              </Card>
                            </Col>
                          </Row>
                        </TabPane>

                        {/* Tab: Rule Snapshot Timeline */}
                        <TabPane
                          tab={<span><HistoryOutlined /> 规则快照</span>}
                          key="snapshot"
                        >
                          {selectedOrderDetail.snapshot ? (
                            <>
                              <div className="snapshot-header">
                                <Space>
                                  <Tag color="blue" style={{ fontSize: 14, padding: '2px 10px' }}>
                                    当前版本: {selectedOrderDetail.order.matchedRuleVersion}
                                  </Tag>
                                  <span className="snapshot-rule-name">
                                    {selectedOrderDetail.matchedRule?.name}
                                  </span>
                                </Space>
                              </div>
                              <Timeline
                                className="snapshot-timeline"
                                items={selectedOrderDetail.snapshot.snapshots.map((snap, idx) => ({
                                  color: snap.version === selectedOrderDetail.order.matchedRuleVersion ? 'blue' : 'gray',
                                  children: (
                                    <Card
                                      size="small"
                                      className={`snapshot-card ${snap.version === selectedOrderDetail.order.matchedRuleVersion ? 'current' : ''}`}
                                    >
                                      <div className="snapshot-card-header">
                                        <Space>
                                          <Tag color={snap.version === selectedOrderDetail.order.matchedRuleVersion ? 'blue' : 'default'} style={{ fontSize: 13 }}>
                                            {snap.version}
                                          </Tag>
                                          <strong>{snap.ruleName}</strong>
                                          {snap.version === selectedOrderDetail.order.matchedRuleVersion && (
                                            <Tag color="green">当前生效</Tag>
                                          )}
                                        </Space>
                                        <span className="snapshot-time">{snap.snapshotTime}</span>
                                      </div>
                                      <div className="snapshot-reason">
                                        <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                                        {snap.reason} — 操作人: {snap.operator}
                                      </div>
                                      <Divider style={{ margin: '8px 0' }} />
                                      <Descriptions size="small" column={2} bordered>
                                        <Descriptions.Item label="业务收入比例">{(snap.rules.businessRatio * 100).toFixed(0)}%</Descriptions.Item>
                                        <Descriptions.Item label="业务收入团队">{snap.rules.businessTeam}</Descriptions.Item>
                                        <Descriptions.Item label="导流收入比例">{(snap.rules.trafficRatio * 100).toFixed(0)}%</Descriptions.Item>
                                        <Descriptions.Item label="导流收入团队">{snap.rules.trafficTeam}</Descriptions.Item>
                                        <Descriptions.Item label="交付收入比例">{(snap.rules.deliveryRatio * 100).toFixed(0)}%</Descriptions.Item>
                                        <Descriptions.Item label="交付收入团队">{snap.rules.deliveryTeam}</Descriptions.Item>
                                        <Descriptions.Item label="渠道分成比例">{(snap.rules.channelRatio * 100).toFixed(0)}%</Descriptions.Item>
                                        <Descriptions.Item label="渠道分成团队">{snap.rules.channelTeam}</Descriptions.Item>
                                      </Descriptions>
                                    </Card>
                                  ),
                                }))}
                              />
                            </>
                          ) : (
                            <div className="empty-text">暂无规则快照</div>
                          )}
                        </TabPane>

                        {/* Tab: Adjustments */}
                        <TabPane
                          tab={<span><SwapOutlined /> 调整记录</span>}
                          key="adjustment"
                        >
                          {selectedOrderDetail.orderAdjustments.length > 0 ? (
                            <Table
                              dataSource={selectedOrderDetail.orderAdjustments}
                              columns={[
                                { title: '调整编号', dataIndex: 'id', key: 'id', width: 100 },
                                { title: '调整类型', dataIndex: 'type', key: 'type', width: 100, render: (v) => <Tag color="orange">{v}</Tag> },
                                { title: '调整原因', dataIndex: 'reason', key: 'reason' },
                                { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
                                { title: '调整时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
                              ]}
                              rowKey="id"
                              size="small"
                              pagination={false}
                              bordered
                            />
                          ) : (
                            <div className="empty-state">
                              <ExclamationCircleOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                              <p>暂无调整记录</p>
                              <Space>
                                <Button type="primary" size="small" icon={<SwapOutlined />} onClick={() => handleAdjust('rule')}>
                                  规则调整
                                </Button>
                                <Button size="small" icon={<EditOutlined />} onClick={() => handleAdjust('revenue')}>
                                  收入调整
                                </Button>
                              </Space>
                            </div>
                          )}
                        </TabPane>
                      </Tabs>
                    </Card>
                  </div>
                )}
              </div>
              </IterationMark>
            </>
          )}

          {/* ====== Order Accounting Page ====== */}
          {selectedMenu === 'order-accounting' && (
            <div className="oa-page">
              {/* Summary Stats */}
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col span={6}>
                  <Card size="small" className="oa-stat-card">
                    <Statistic
                      title="订单总数"
                      value={oaSummary.total}
                      suffix="条"
                      valueStyle={{ color: '#1890ff', fontSize: 24 }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" className="oa-stat-card">
                    <Statistic
                      title="已确认收入"
                      value={oaSummary.totalConfirmed}
                      prefix="¥"
                      valueStyle={{ color: '#52c41a', fontSize: 24 }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" className="oa-stat-card">
                    <Statistic
                      title="未确认收入"
                      value={oaSummary.totalUnconfirmed}
                      prefix="¥"
                      valueStyle={{ color: '#faad14', fontSize: 24 }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" className="oa-stat-card">
                    <Statistic
                      title="合计金额"
                      value={oaSummary.totalConfirmed + oaSummary.totalUnconfirmed}
                      prefix="¥"
                      valueStyle={{ color: '#1890ff', fontSize: 24 }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Filter Area */}
              <Card className="filter-card" size="small">
                {oaFilterExpanded && (
                  <Row gutter={[8, 8]} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={4}>
                      <Input placeholder="买家姓名" value={oaFilters.buyer}
                        onChange={(e) => setOaFilters({ ...oaFilters, buyer: e.target.value })} allowClear
                      />
                    </Col>
                    <Col span={5}>
                      <Input placeholder="产品信息" value={oaFilters.product}
                        onChange={(e) => setOaFilters({ ...oaFilters, product: e.target.value })} allowClear
                      />
                    </Col>
                    <Col span={3}>
                      <Select placeholder="产品类型" style={{ width: '100%' }} value={oaFilters.productType || undefined}
                        onChange={(v) => setOaFilters({ ...oaFilters, productType: v })} allowClear
                        options={[...new Set(orders.map(o => o.productType))].map(v => ({ value: v, label: v }))}
                      />
                    </Col>
                    <Col span={3}>
                      <Select placeholder="客户来源" style={{ width: '100%' }} value={oaFilters.buyerSource || undefined}
                        onChange={(v) => setOaFilters({ ...oaFilters, buyerSource: v })} allowClear
                        options={[...new Set(orders.map(o => o.buyerSource))].map(v => ({ value: v, label: v }))}
                      />
                    </Col>
                    <Col span={4}>
                      <Input placeholder="规则名称" value={oaFilters.ruleName}
                        onChange={(e) => setOaFilters({ ...oaFilters, ruleName: e.target.value })} allowClear
                      />
                    </Col>
                    <Col span={3}>
                      <Select placeholder="规则编码" style={{ width: '100%' }} value={oaFilters.ruleId || undefined}
                        onChange={(v) => setOaFilters({ ...oaFilters, ruleId: v })} allowClear
                        options={[...new Set(ruleVersions.map(r => r.id))].map(v => ({ value: v, label: v }))}
                      />
                    </Col>
                    <Col span={3}>
                      <Select placeholder="规则版本" style={{ width: '100%' }} value={oaFilters.ruleVersion || undefined}
                        onChange={(v) => setOaFilters({ ...oaFilters, ruleVersion: v })} allowClear
                        options={[...new Set(ruleVersions.map(r => r.version))].map(v => ({ value: v, label: v }))}
                      />
                    </Col>
                  </Row>
                )}
                <Row gutter={[8, 8]} align="middle">
                  <Col span={4}>
                    <Input
                      placeholder="订单号" prefix={<SearchOutlined />}
                      value={oaFilters.orderNo}
                      onChange={(e) => setOaFilters({ ...oaFilters, orderNo: e.target.value })}
                      allowClear
                    />
                  </Col>
                  <Col span={3}>
                    <Select placeholder="订单类型" style={{ width: '100%' }} value={oaFilters.orderType || undefined}
                      onChange={(v) => setOaFilters({ ...oaFilters, orderType: v })} allowClear
                      options={[...new Set(orders.map(o => o.orderType))].map(v => ({ value: v, label: v }))}
                    />
                  </Col>
                  <Col span={3}>
                    <Select placeholder="订单状态" style={{ width: '100%' }} value={oaFilters.status || undefined}
                      onChange={(v) => setOaFilters({ ...oaFilters, status: v })} allowClear
                      options={[...new Set(orders.map(o => o.status))].map(v => ({ value: v, label: v }))}
                    />
                  </Col>
                  <Col span={7}>
                    <RangePicker
                      style={{ width: '100%' }}
                      value={oaFilters.dateRange}
                      onChange={(v) => setOaFilters({ ...oaFilters, dateRange: v })}
                      placeholder={['开始时间', '结束时间']}
                    />
                  </Col>
                  <Col>
                    <Space size={4}>
                      <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                      <Button icon={<ReloadOutlined />} onClick={handleResetOaFilters}>重置</Button>
                      <Button type="link" onClick={() => setOaFilterExpanded(!oaFilterExpanded)}>
                        {oaFilterExpanded ? '收起' : '展开'} {oaFilterExpanded ? <UpOutlined /> : <DownOutlined />}
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* Order Table */}
              <IterationMark mark="order-accounting-table">
              <Card
                title={
                  <Space>
                    <UnorderedListOutlined />
                    <span>订单核算列表</span>
                    <Tag color="blue">{oaFilteredOrders.length} 条</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button icon={<ExportOutlined />}>导出</Button>
                    <Button icon={<ReloadOutlined />}>刷新</Button>
                  </Space>
                }
                size="small"
                className="oa-table-card"
              >
                <Table
                  dataSource={oaFilteredOrders}
                  columns={orderAccountingColumns}
                  rowKey="orderNo"
                  size="middle"
                  scroll={{ x: 5330, y: 600 }}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (t) => `共 ${t} 条`,
                    pageSizeOptions: [10, 20, 50, 100],
                  }}
                  bordered
                />
              </Card>
              </IterationMark>
            </div>
          )}

          {selectedMenu === 'order-detail' && selectedOrderId && (
            <OrderDetailPage orderId={selectedOrderId} onBack={handleBackFromDetail} />
          )}

          {/* ====== Adjustment Page ====== */}
          {selectedMenu === 'adjustment' && (
            <AdjustmentPage />
          )}

          {/* ====== Demo Admin ====== */}
          {selectedMenu === 'demo-admin' && <DemoAdminPage />}

          {/* ====== Placeholder for other menus ====== */}
          {!['revenue', 'order-accounting', 'order-detail', 'adjustment', 'demo-admin'].includes(selectedMenu) && (
            <div className="empty-state" style={{ paddingTop: 100 }}>
              <ExclamationCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <p style={{ fontSize: 16, color: '#8c8c8c', marginTop: 16 }}>{currentBreadcrumb.label} - 功能开发中</p>
            </div>
          )}
        </Content>
      </Layout>

      {/* ====== Adjust Modal ====== */}
      <Modal
        title={adjustType === 'rule' ? '规则调整' : '收入调整'}
        open={adjustModalVisible}
        onOk={handleAdjustSubmit}
        onCancel={() => { setAdjustModalVisible(false); adjustForm.resetFields(); }}
        okText="提交"
        cancelText="取消"
        width={560}
      >
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, fontSize: 13 }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 6 }} />
          {adjustType === 'rule'
            ? '规则调整仅影响未来产生的收入，已确认的历史收入不受影响。'
            : '收入调整将直接影响订单的已确认收入金额。'}
        </div>
        <Form form={adjustForm} layout="vertical" size="middle">
          <Form.Item label="当前订单">{selectedOrder}</Form.Item>
          {adjustType === 'rule' ? (
            <>
              <Form.Item label="目标规则版本" name="targetVersion" rules={[{ required: true, message: '请选择目标规则版本' }]}>
                <Select placeholder="请选择规则版本">
                  {ruleVersions.map((rv) => (
                    <Select.Option key={rv.id} value={rv.version}>
                      <Space>
                        <Tag color="blue">{rv.version}</Tag>
                        <span>{rv.name}</span>
                        <Tag color={statusColorMap[rv.status]}>{rv.status}</Tag>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="生效时间" name="effectiveTime" rules={[{ required: true, message: '请选择生效时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} placeholder="选择生效时间" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item label="调整类型" name="adjustCategory" rules={[{ required: true, message: '请选择调整类型' }]}>
                <Select placeholder="请选择调整类型">
                  <Select.Option value="increase">调增</Select.Option>
                  <Select.Option value="decrease">调减</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="调整金额" name="adjustAmount" rules={[{ required: true, message: '请输入调整金额' }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" placeholder="请输入调整金额" />
              </Form.Item>
              <Form.Item label="收入类型" name="revenueType" rules={[{ required: true, message: '请选择收入类型' }]}>
                <Select placeholder="请选择收入类型">
                  <Select.Option value="业务收入">业务收入</Select.Option>
                  <Select.Option value="导流收入">导流收入</Select.Option>
                  <Select.Option value="交付收入">交付收入</Select.Option>
                  <Select.Option value="渠道分成">渠道分成</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
          <Form.Item label="调整原因" name="reason" rules={[{ required: true, message: '请输入调整原因' }]}>
            <Input.TextArea rows={3} placeholder="请输入调整原因" />
          </Form.Item>
        </Form>
      </Modal>
      <DemoToggle />
      <DocDrawer />
    </Layout>
  );
}
