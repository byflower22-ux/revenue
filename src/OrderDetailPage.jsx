import { useMemo, useState, useCallback } from 'react';
import {
  Card, Descriptions, Table, Tabs, Button, Tag, Space, Timeline,
  Modal, Form, Select, InputNumber, DatePicker, Input, Divider,
  Row, Col, message,
} from 'antd';
import {
  ArrowLeftOutlined, SwapOutlined, EditOutlined,
  ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  HistoryOutlined, MoneyCollectOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  ruleVersions, ruleSnapshots, payments, deliveries,
  calculateRevenueBreakdown, calculateRevenueFlows, addAdjustment, updateOrder,
  getStoredOrders, getStoredAdjustments, resetStorage,
} from './mockData';
import IterationMark from './demo/IterationMark';

const { TabPane } = Tabs;

const statusColorMap = {
  '已完成': 'green',
  '已支付': 'blue',
  '待交付': 'orange',
  '已取消': 'red',
};

const revenueTypeColorMap = {
  '业务收入1': '#1890ff',
  '业务收入2': '#36cfc9',
  '导流收入': '#52c41a',
  '业务渠道分成': '#fa8c16',
  '交付收入': '#722ed1',
};

function Money({ value, color, bold }) {
  return (
    <span style={{ fontWeight: bold ? 700 : 600, color: color || '#262626' }}>
      ¥{Math.abs(value).toLocaleString()}
    </span>
  );
}

export default function OrderDetailPage({ orderId, onBack }) {
  const [detailTab, setDetailTab] = useState('revenue-detail');
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustType, setAdjustType] = useState('rule');
  const [adjustForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [refreshKey, setRefreshKey] = useState(0);

  const detail = useMemo(() => {
    const storedOrders = getStoredOrders();
    const storedAdjustments = getStoredAdjustments();
    const order = storedOrders.find((o) => o.orderNo === orderId);
    if (!order) return null;

    const orderAdjustments = storedAdjustments.filter((a) => a.orderNo === order.orderNo);
    const snapshot = ruleSnapshots.find((s) => s.orderNo === order.orderNo);
    const matchedRule = ruleVersions.find((rv) => rv.id === order.matchedRuleId);
    const revenueBreakdown = calculateRevenueBreakdown(order, orderAdjustments);
    const revenueFlows = calculateRevenueFlows(order, orderAdjustments);

    const orderPayments = payments.filter((p) => p.orderNo === order.orderNo);
    const orderDeliveries = deliveries.filter((d) => d.orderNo === order.orderNo);

    return { order, orderPayments, orderDeliveries, snapshot, matchedRule, orderAdjustments, revenueBreakdown, revenueFlows };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    messageApi.success('已刷新');
  }, [messageApi]);

  const handleReset = useCallback(() => {
    resetStorage();
    setRefreshKey((k) => k + 1);
    messageApi.success('数据已重置为初始状态');
  }, [messageApi]);

  const handleAdjust = useCallback((type) => {
    setAdjustType(type);
    adjustForm.resetFields();
    setAdjustModalVisible(true);
  }, [adjustForm]);

  const handleAdjustSubmit = useCallback(() => {
    adjustForm.validateFields().then((values) => {
      if (adjustType === 'revenue') {
        addAdjustment({
          orderNo: orderId,
          type: '收入调整',
          reason: values.reason,
          details: {
            adjustCategory: values.adjustCategory,
            adjustAmount: values.adjustAmount,
            revenueType: values.revenueType,
          },
          operator: '当前用户',
        });
      } else {
        const targetRule = ruleVersions.find((rv) => rv.version === values.targetVersion);
        if (targetRule) {
          updateOrder(orderId, {
            matchedRuleVersion: values.targetVersion,
            matchedRuleId: targetRule.id,
          });
          addAdjustment({
            orderNo: orderId,
            type: '规则调整',
            reason: values.reason,
            details: {
              targetVersion: values.targetVersion,
              effectiveTime: values.effectiveTime?.format('YYYY-MM-DD HH:mm:ss'),
            },
            operator: '当前用户',
          });
        }
      }
      setRefreshKey((k) => k + 1);
      messageApi.success(`${adjustType === 'rule' ? '规则调整' : '收入调整'}已提交，数据已更新`);
      setAdjustModalVisible(false);
      adjustForm.resetFields();
    });
  }, [adjustType, adjustForm, orderId, messageApi]);

  if (!detail) {
    return (
      <div className="empty-state" style={{ paddingTop: 100 }}>
        <ExclamationCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
        <p style={{ fontSize: 16, color: '#8c8c8c', marginTop: 16 }}>未找到订单信息</p>
        <Button type="primary" onClick={onBack}>返回列表</Button>
      </div>
    );
  }

  const { order, orderPayments, orderDeliveries, snapshot, matchedRule, orderAdjustments, revenueBreakdown, revenueFlows } = detail;
  const isActivity = order.orderType === '活动门票';
  const isPartnerDelivery = order.orderType === '合作方交付';
  const confirmationRate = revenueBreakdown.totalToConfirm > 0
    ? (revenueBreakdown.totalConfirmed / revenueBreakdown.totalToConfirm) * 100
    : 0;
  const ratioSegmentTotal = revenueBreakdown.items.reduce((sum, item) => sum + Math.abs(item.ratio), 0);

  return (
    <div className="od-page od-split-page">
      {contextHolder}

      {/* ====== Top Action Bar ====== */}
      <div className="od-top-bar">
        <div className="od-top-main">
          <Button className="od-back-button" icon={<ArrowLeftOutlined />} onClick={onBack}>返回列表</Button>
          <div className="od-title-block">
            <div className="od-title-row">
              <span className="od-page-title">订单核算详情</span>
              <Tag color={statusColorMap[order.status]}>{order.status}</Tag>
              <Tag>{order.orderType}</Tag>
            </div>
            <div className="od-title-meta">
              <span>{order.orderNo}</span>
              <span>{order.product}</span>
              <span>{order.buyer}</span>
            </div>
          </div>
        </div>
        <Space className="od-action-group" wrap>
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleAdjust('revenue')}>收入调整</Button>
          <Button icon={<SwapOutlined />} onClick={() => handleAdjust('rule')}>规则调整</Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Button icon={<UndoOutlined />} onClick={handleReset} danger>重置数据</Button>
        </Space>
      </div>

      {/* ====== Main Split Layout ====== */}
      <IterationMark version="2.1" date="04-23" type="modified" label="订单详情 — 分栏布局">
      <div className="od-split-body">
        {/* --- Left Sidebar: Order Info --- */}
        <div className="od-split-left">
          {/* Order summary header */}
          <div className="od-left-header">
            <div className="od-left-order-no">{order.orderNo}</div>
            <div className="od-left-amount">
              <Tag color={statusColorMap[order.status]} style={{ marginRight: 8 }}>{order.status}</Tag>
              <span style={{ fontWeight: 700, color: '#f5222d', fontSize: 16 }}>¥{order.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Core Info */}
          <div className="od-left-section">
            <div className="od-left-section-title">核心信息</div>
            <div className="od-left-info-grid">
              <div className="od-info-row"><span className="od-info-label">订单类型</span><span className="od-info-value"><Tag>{order.orderType}</Tag></span></div>
              <div className="od-info-row"><span className="od-info-label">实际支付</span><span className="od-info-value"><Money value={order.actualPayAmount || 0} bold /></span></div>
              <div className="od-info-row"><span className="od-info-label">退款金额</span><span className="od-info-value">{order.refundAmount > 0 ? <Money value={order.refundAmount} color="#f5222d" /> : '-'}</span></div>
              <div className="od-info-row"><span className="od-info-label">下单时间</span><span className="od-info-value">{order.createTime}</span></div>
              <div className="od-info-row"><span className="od-info-label">支付时间</span><span className="od-info-value">{order.payTime || '-'}</span></div>
              {isPartnerDelivery && (
                <>
                  <div className="od-info-row"><span className="od-info-label">扣除比例</span><span className="od-info-value">{order.deductionRatio ? `${(order.deductionRatio * 100).toFixed(0)}%` : '-'}</span></div>
                  <div className="od-info-row"><span className="od-info-label">扣除金额</span><span className="od-info-value">{order.deductionAmount > 0 ? <Money value={order.deductionAmount} color="#f5222d" /> : '-'}</span></div>
                </>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="od-left-section">
            <div className="od-left-section-title">{isActivity ? '活动信息' : '产品信息'}</div>
            <div className="od-left-info-grid">
              <div className="od-info-row"><span className="od-info-label">{isActivity ? '活动名称' : '产品名称'}</span><span className="od-info-value">{order.product}</span></div>
              <div className="od-info-row"><span className="od-info-label">产品类型</span><span className="od-info-value">{order.productType}</span></div>
              <div className="od-info-row"><span className="od-info-label">产品归属</span><span className="od-info-value" style={{ fontSize: 11 }}>{order.productAttribution}</span></div>
              {isActivity && (
                <>
                  <div className="od-info-row"><span className="od-info-label">活动类型</span><span className="od-info-value">{order.activityType || '-'}</span></div>
                  <div className="od-info-row"><span className="od-info-label">活动主办方</span><span className="od-info-value">{order.activityOrganizer || '-'}</span></div>
                  <div className="od-info-row"><span className="od-info-label">活动邀约人</span><span className="od-info-value">{order.activityInviter || '-'}</span></div>
                </>
              )}
            </div>
          </div>

          {/* Person Info */}
          <div className="od-left-section">
            <div className="od-left-section-title">负责人与客户</div>
            <div className="od-left-info-grid">
              <div className="od-info-row"><span className="od-info-label">客户负责人</span><span className="od-info-value">{order.employee}</span></div>
              <div className="od-info-row"><span className="od-info-label">负责人团队</span><span className="od-info-value">{order.team}</span></div>
              <div className="od-info-row"><span className="od-info-label">部门</span><span className="od-info-value">{order.department}</span></div>
              <div className="od-info-row"><span className="od-info-label">成交方式</span><span className="od-info-value">{order.tradeMethod}</span></div>
              <div className="od-info-row"><span className="od-info-label">买家姓名</span><span className="od-info-value">{order.buyer}</span></div>
              <div className="od-info-row"><span className="od-info-label">客户来源</span><span className="od-info-value">{order.buyerSource}</span></div>
              <div className="od-info-row"><span className="od-info-label">购买阶段</span><span className="od-info-value">{order.purchaseStage}</span></div>
              <div className="od-info-row"><span className="od-info-label">博商咨询购买阶段</span><span className="od-info-value">{order.bsPurchaseStage || '-'}</span></div>
              {order.memberBatch && <div className="od-info-row"><span className="od-info-label">会员批次</span><span className="od-info-value">{order.memberBatch}</span></div>}
              {order.deliveryCompanyName && <div className="od-info-row"><span className="od-info-label">交付客户公司</span><span className="od-info-value">{order.deliveryCompanyName}</span></div>}
            </div>
          </div>

          {/* Rule info */}
          <div className="od-left-section">
            <div className="od-left-section-title">匹配规则</div>
            <div className="od-left-info-grid">
              <div className="od-info-row"><span className="od-info-label">规则版本</span><span className="od-info-value"><Tag color="blue">{order.matchedRuleVersion}</Tag></span></div>
              <div className="od-info-row"><span className="od-info-label">规则名称</span><span className="od-info-value">{matchedRule?.name || '-'}</span></div>
            </div>
          </div>
        </div>

        {/* --- Right Main: Accounting Content --- */}
        <div className="od-split-right">
          <IterationMark version="2.0" date="04-22" type="new" label="收入确认概览">
          {/* Revenue summary card */}
          <div className="od-stats-card">
            <div className="od-stats-head">
              <div>
                <div className="od-panel-eyebrow">Revenue confirmation</div>
                <div className="od-panel-title">收入确认概览</div>
              </div>
              <div className="od-rate-pill">
                <CheckCircleOutlined />
                <span>{confirmationRate.toFixed(1)}%</span>
              </div>
            </div>

            <div className="od-stats-totals">
              <div className="od-stats-total-item">
                <div className="od-stats-total-label">总应确认</div>
                <div className="od-stats-total-value">¥{revenueBreakdown.totalToConfirm.toLocaleString()}</div>
              </div>
              <div className="od-stats-total-item">
                <div className="od-stats-total-label">已确认</div>
                <div className="od-stats-total-value" style={{ color: '#52c41a' }}>¥{revenueBreakdown.totalConfirmed.toLocaleString()}</div>
              </div>
              <div className="od-stats-total-item">
                <div className="od-stats-total-label">待确认</div>
                <div className="od-stats-total-value" style={{ color: '#faad14' }}>¥{revenueBreakdown.totalPending.toLocaleString()}</div>
              </div>
            </div>

            <div className="od-composition-wrap" aria-label="收入类型规则比例构成">
              <div className="od-composition-bar">
                {revenueBreakdown.items.map((item) => (
                  <div
                    key={item.key}
                    className={`od-composition-segment ${item.ratio < 0 ? 'is-negative' : ''}`}
                    title={`${item.name}: 比例 ${(item.ratio * 100).toFixed(0)}%, 已确认 ¥${item.confirmed.toLocaleString()}`}
                    style={{
                      width: `${ratioSegmentTotal > 0 ? (Math.abs(item.ratio) / ratioSegmentTotal) * 100 : 0}%`,
                      backgroundColor: revenueTypeColorMap[item.name],
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="od-stats-types">
              {revenueBreakdown.items.map((item) => (
                <div key={item.key} className={`od-stats-type-row ${item.ratio < 0 ? 'is-negative' : ''}`}>
                  <span className="od-stats-type-name">
                    <span
                      className="od-stats-type-dot"
                      style={{ background: revenueTypeColorMap[item.name] }}
                    />
                    {item.name}
                  </span>
                  <span className="od-stats-type-ratio" style={{ color: revenueTypeColorMap[item.name] }}>
                    {(item.ratio * 100).toFixed(0)}%
                  </span>
                  <span className="od-stats-type-team">{item.team}</span>
                  <span className="od-stats-type-confirmed" style={{ color: revenueTypeColorMap[item.name] }}>
                    已确认 {item.confirmed < 0 ? '-¥' : '¥'}{Math.abs(item.confirmed).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          </IterationMark>

          {/* Main tabs */}
          <Card size="small" className="od-section-card">
            <Tabs activeKey={detailTab} onChange={setDetailTab} size="small" className="od-detail-tabs">
              {/* Tab: Revenue Detail */}
              <TabPane tab={<span><MoneyCollectOutlined /> 收入核算明细</span>} key="revenue-detail">
                <IterationMark version="2.0" date="04-22" type="new" label="收入核算明细">
                <Table
                  dataSource={revenueFlows}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  bordered
                  scroll={{ x: 1100 }}
                  columns={[
                    {
                      title: '时间', dataIndex: 'time', key: 'time', width: 130, fixed: 'left',
                    },
                    {
                      title: '操作类型', dataIndex: 'operationType', key: 'operationType', width: 70, align: 'center',
                    },
                    {
                      title: '操作子类型', dataIndex: 'operationSubType', key: 'operationSubType', width: 130,
                    },
                    {
                      title: '收入类型', dataIndex: 'revenueType', key: 'revenueType', width: 80,
                      render: (v) => <Tag color={revenueTypeColorMap[v]}>{v}</Tag>,
                    },
                    {
                      title: '明细单号', dataIndex: 'detailNo', key: 'detailNo', width: 150,
                    },
                    {
                      title: '变化金额', dataIndex: 'changeAmount', key: 'changeAmount', width: 100, align: 'right',
                      render: (v) => <span>¥{v.toLocaleString()}</span>,
                    },
                    {
                      title: '确认基数', dataIndex: 'confirmBase', key: 'confirmBase', width: 100, align: 'right',
                      render: (v) => <span>¥{v.toLocaleString()}</span>,
                    },
                    {
                      title: '确认比例', dataIndex: 'confirmRatio', key: 'confirmRatio', width: 70, align: 'center',
                      render: (v) => v != null ? `${(v * 100).toFixed(0)}%` : '-',
                    },
                    {
                      title: '确认金额', dataIndex: 'confirmedAmount', key: 'confirmedAmount', width: 100, align: 'right',
                      render: (v) => (
                        <span style={{ fontWeight: 600, color: v >= 0 ? '#262626' : '#f5222d' }}>
                          {v >= 0 ? '+' : ''}¥{Math.abs(v).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      title: '归属团队', dataIndex: 'team', key: 'team', width: 100,
                    },
                    {
                      title: '交付单号', dataIndex: 'deliveryNo', key: 'deliveryNo', width: 90,
                      render: (v) => v || '-',
                    },
                    {
                      title: '售后单号', dataIndex: 'afterSaleNo', key: 'afterSaleNo', width: 120,
                      render: (v) => v || '-',
                    },
                  ]}
                />
                </IterationMark>
              </TabPane>

              <TabPane tab={<span><HistoryOutlined /> 规则快照</span>} key="snapshot">
                <IterationMark version="2.0" date="04-22" type="new" label="规则快照">
                {snapshot ? (
                  <>
                    <div className="snapshot-header">
                      <Space>
                        <Tag color="blue" style={{ fontSize: 14, padding: '2px 10px' }}>
                          当前版本: {order.matchedRuleVersion}
                        </Tag>
                        <span className="snapshot-rule-name">{matchedRule?.name}</span>
                      </Space>
                    </div>
                    <Timeline
                      className="snapshot-timeline"
                      items={snapshot.snapshots.map((snap) => ({
                        color: snap.version === order.matchedRuleVersion ? 'blue' : 'gray',
                        children: (
                          <Card
                            size="small"
                            className={`snapshot-card ${snap.version === order.matchedRuleVersion ? 'current' : ''}`}
                          >
                            <div className="snapshot-card-header">
                              <Space>
                                <Tag color={snap.version === order.matchedRuleVersion ? 'blue' : 'default'} style={{ fontSize: 13 }}>
                                  {snap.version}
                                </Tag>
                                <strong>{snap.ruleName}</strong>
                                {snap.version === order.matchedRuleVersion && <Tag color="green">当前生效</Tag>}
                              </Space>
                              <span className="snapshot-time">{snap.snapshotTime}</span>
                            </div>
                            <div className="snapshot-reason">
                              <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                              {snap.reason} — 操作人: {snap.operator}
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <Descriptions size="small" column={2} bordered>
                              <Descriptions.Item label="业务收入1比例">{(snap.rules.business1Ratio * 100).toFixed(0)}%</Descriptions.Item>
                              <Descriptions.Item label="业务收入1团队">{snap.rules.business1Team}</Descriptions.Item>
                              <Descriptions.Item label="业务收入2比例">{(snap.rules.business2Ratio * 100).toFixed(0)}%</Descriptions.Item>
                              <Descriptions.Item label="业务收入2团队">{snap.rules.business2Team}</Descriptions.Item>
                              <Descriptions.Item label="导流收入比例">{(snap.rules.trafficRatio * 100).toFixed(0)}%</Descriptions.Item>
                              <Descriptions.Item label="导流收入团队">{snap.rules.trafficTeam}</Descriptions.Item>
                              <Descriptions.Item label="交付收入比例">{(snap.rules.deliveryRatio * 100).toFixed(0)}%</Descriptions.Item>
                              <Descriptions.Item label="交付收入团队">{snap.rules.deliveryTeam}</Descriptions.Item>
                              <Descriptions.Item label="业务渠道分成比例">{(snap.rules.channelRatio * 100).toFixed(0)}%</Descriptions.Item>
                              <Descriptions.Item label="业务渠道分成团队">{snap.rules.channelTeam}</Descriptions.Item>
                            </Descriptions>
                          </Card>
                        ),
                      }))}
                    />
                  </>
                ) : (
                  <div className="empty-text">暂无规则快照</div>
                )}
                </IterationMark>
              </TabPane>

              <TabPane tab={<span><CheckCircleOutlined /> 支付/交付记录</span>} key="payment">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="支付记录" size="small" className="sub-card">
                      {orderPayments.length > 0 ? (
                        <Table
                          dataSource={orderPayments}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          bordered
                          columns={[
                            { title: '支付单号', dataIndex: 'id', key: 'id', width: 90 },
                            { title: '支付方式', dataIndex: 'payMethod', key: 'payMethod', width: 90 },
                            { title: '支付金额', dataIndex: 'amount', key: 'amount', width: 100, align: 'right', render: (v) => `¥${v.toLocaleString()}` },
                            { title: '支付时间', dataIndex: 'payTime', key: 'payTime' },
                            { title: '状态', dataIndex: 'status', key: 'status', width: 80, align: 'center', render: (v) => <Tag color="green">{v}</Tag> },
                          ]}
                        />
                      ) : <div className="empty-text">暂无支付记录</div>}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="交付记录" size="small" className="sub-card">
                      {orderDeliveries.length > 0 ? (
                        <Table
                          dataSource={orderDeliveries}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          bordered
                          columns={[
                            { title: '交付单号', dataIndex: 'id', key: 'id', width: 90 },
                            { title: '交付内容', dataIndex: 'content', key: 'content' },
                            { title: '交付时间', dataIndex: 'deliveryTime', key: 'deliveryTime' },
                            { title: '状态', dataIndex: 'status', key: 'status', width: 80, align: 'center', render: (v) => <Tag color="green">{v}</Tag> },
                          ]}
                        />
                      ) : <div className="empty-text">暂无交付记录</div>}
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab={<span><SwapOutlined /> 调整记录 {orderAdjustments.length > 0 && <Tag color="orange" style={{ marginLeft: 4 }}>{orderAdjustments.length}</Tag>}</span>} key="adjustment">
                {orderAdjustments.length > 0 ? (
                  <Table
                    dataSource={orderAdjustments}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    bordered
                    columns={[
                      { title: '调整编号', dataIndex: 'id', key: 'id', width: 100 },
                      { title: '调整类型', dataIndex: 'type', key: 'type', width: 100, render: (v) => <Tag color={v === '收入调整' ? 'orange' : 'blue'}>{v}</Tag> },
                      {
                        title: '调整详情', key: 'details',
                        render: (_, r) => {
                          if (r.type === '收入调整') {
                            const cat = r.details?.adjustCategory === 'increase' ? '调增' : '调减';
                            return `${r.details?.revenueType} ${cat} ¥${(r.details?.adjustAmount || 0).toLocaleString()}`;
                          }
                          return `切换至规则 ${r.details?.targetVersion}`;
                        },
                      },
                      { title: '调整原因', dataIndex: 'reason', key: 'reason' },
                      { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
                      { title: '调整时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
                    ]}
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
      </div>
      </IterationMark>

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
            ? '规则调整将立即更新当前订单的收入分配比例，已确认的历史收入不受影响。'
            : '收入调整将直接影响订单的已确认收入金额。'}
        </div>
        <Form form={adjustForm} layout="vertical" size="middle">
          <Form.Item label="当前订单">{orderId}</Form.Item>
          {adjustType === 'rule' ? (
            <>
              <Form.Item label="目标规则版本" name="targetVersion" rules={[{ required: true, message: '请选择目标规则版本' }]}>
                <Select placeholder="请选择规则版本">
                  {ruleVersions.map((rv) => (
                    <Select.Option key={rv.id} value={rv.version}>
                      <Space>
                        <Tag color="blue">{rv.version}</Tag>
                        <span>{rv.name}</span>
                        <Tag color={rv.status === '生效中' ? 'green' : 'default'}>{rv.status}</Tag>
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
                  <Select.Option value="业务收入1">业务收入1</Select.Option>
                  <Select.Option value="业务收入2">业务收入2</Select.Option>
                  <Select.Option value="导流收入">导流收入</Select.Option>
                  <Select.Option value="业务渠道分成">业务渠道分成</Select.Option>
                  <Select.Option value="交付收入">交付收入</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
          <Form.Item label="调整原因" name="reason" rules={[{ required: true, message: '请输入调整原因' }]}>
            <Input.TextArea rows={3} placeholder="请输入调整原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
