# 订单详情页 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在订单核算管理模块中新增独立订单详情页，展示订单完整的核算信息。

**Architecture:** 提取为独立组件 `OrderDetailPage.jsx`，通过 props 接收订单 ID 和 mock 数据。`App.jsx` 新增 `order-detail` 页面分支和 `selectedOrderId` 状态。订单核算表格增加「查看详情」操作列。

**Tech Stack:** React 19 + Ant Design 6 + dayjs

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/mockData.js` | Modify | 补充收入确认状态字段，新增 `calculateRevenueBreakdown` 函数 |
| `src/OrderDetailPage.jsx` | Create | 订单详情页独立组件 |
| `src/App.jsx` | Modify | 新增状态、路由分支、表格操作列 |
| `src/App.css` | Modify | 新增详情页样式 |

---

### Task 1: 补充 mockData 数据模型

**Files:**
- Modify: `src/mockData.js`

- [ ] **Step 1: 在 `mockData.js` 末尾（`addAdjustment` 函数之后）添加 `calculateRevenueBreakdown` 函数**

此函数根据订单状态计算每种收入的应确认、待确认、已确认金额。

```js
export function calculateRevenueBreakdown(order) {
  const ruleVersion = ruleVersions.find((rv) => rv.version === order.matchedRuleVersion);
  if (!ruleVersion) return { totalPending: 0, totalConfirmed: 0, totalToConfirm: 0, items: [] };

  const rules = ruleVersion.rules;
  const amount = order.amount;
  const isPaid = !!order.payTime;
  const isDelivered = !!order.deliveryTime;
  const isCancelled = order.status === '已取消';

  const types = [
    { key: 'business', name: '业务收入', ratio: rules.businessRatio, trigger: '支付' },
    { key: 'traffic', name: '导流收入', ratio: rules.trafficRatio, trigger: '支付' },
    { key: 'channel', name: '渠道分成', ratio: rules.channelRatio, trigger: '支付' },
    { key: 'delivery', name: '交付收入', ratio: rules.deliveryRatio, trigger: '交付' },
  ];

  let totalConfirmed = 0;
  let totalPending = 0;

  const items = types.map((t) => {
    const full = +(amount * t.ratio).toFixed(2);
    let confirmed = 0;
    let pending = 0;

    if (isCancelled) {
      confirmed = 0;
      pending = 0;
    } else if (t.trigger === '支付') {
      if (isPaid && isDelivered) {
        confirmed = full;
        pending = 0;
      } else if (isPaid) {
        confirmed = 0;
        pending = full;
      }
    } else {
      if (isDelivered) {
        confirmed = full;
        pending = 0;
      } else if (isPaid) {
        confirmed = 0;
        pending = full;
      }
    }

    totalConfirmed += confirmed;
    totalPending += pending;

    return { key: t.key, name: t.name, ratio: t.ratio, toConfirm: full, pending, confirmed };
  });

  return {
    totalToConfirm: totalConfirmed + totalPending,
    totalPending,
    totalConfirmed,
    items,
  };
}
```

---

### Task 2: 创建 OrderDetailPage 组件

**Files:**
- Create: `src/OrderDetailPage.jsx`

- [ ] **Step 1: 创建 `src/OrderDetailPage.jsx` 文件**

```jsx
import { useMemo, useState } from 'react';
import {
  Card, Descriptions, Table, Tabs, Button, Tag, Space, Timeline,
  Modal, Form, Select, InputNumber, DatePicker, Input, Divider,
  Row, Col, Statistic, Breadcrumb, message,
} from 'antd';
import {
  ArrowLeftOutlined, SwapOutlined, EditOutlined, ExportOutlined,
  ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  HistoryOutlined, PlusOutlined, HomeOutlined, MoneyCollectOutlined,
} from '@ant-design/icons';
import {
  orders, payments, deliveries, ruleVersions, ruleSnapshots,
  calculateRevenueBreakdown, adjustments, addAdjustment,
} from './mockData';

const { TabPane } = Tabs;

const statusColorMap = {
  '已完成': 'green',
  '已支付': 'blue',
  '待交付': 'orange',
  '已取消': 'red',
};

const revenueTypeColorMap = {
  '业务收入': '#1890ff',
  '导流收入': '#52c41a',
  '交付收入': '#722ed1',
  '渠道分成': '#fa8c16',
};

export default function OrderDetailPage({ orderId, onBack }) {
  const [detailTab, setDetailTab] = useState('snapshot');
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustType, setAdjustType] = useState('rule');
  const [adjustForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const detail = useMemo(() => {
    const order = orders.find((o) => o.orderNo === orderId);
    if (!order) return null;

    const orderPayments = payments.filter((p) => p.orderNo === order.orderNo);
    const orderDeliveries = deliveries.filter((d) => d.orderNo === order.orderNo);
    const snapshot = ruleSnapshots.find((s) => s.orderNo === order.orderNo);
    const matchedRule = ruleVersions.find((rv) => rv.id === order.matchedRuleId);
    const orderAdjustments = adjustments.filter((a) => a.orderNo === order.orderNo);
    const revenueBreakdown = calculateRevenueBreakdown(order);

    return { order, orderPayments, orderDeliveries, snapshot, matchedRule, orderAdjustments, revenueBreakdown };
  }, [orderId]);

  const handleAdjust = (type) => {
    setAdjustType(type);
    adjustForm.resetFields();
    setAdjustModalVisible(true);
  };

  const handleAdjustSubmit = () => {
    adjustForm.validateFields().then((values) => {
      addAdjustment({
        orderNo: orderId,
        type: adjustType === 'rule' ? '规则调整' : '收入调整',
        reason: values.reason,
        details: values,
        operator: '当前用户',
      });
      messageApi.success(`${adjustType === 'rule' ? '规则调整' : '收入调整'}已提交`);
      setAdjustModalVisible(false);
      adjustForm.resetFields();
    });
  };

  if (!detail) {
    return (
      <div className="empty-state" style={{ paddingTop: 100 }}>
        <ExclamationCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
        <p style={{ fontSize: 16, color: '#8c8c8c', marginTop: 16 }}>未找到订单信息</p>
        <Button type="primary" onClick={onBack}>返回列表</Button>
      </div>
    );
  }

  const { order, orderPayments, orderDeliveries, snapshot, matchedRule, orderAdjustments, revenueBreakdown } = detail;
  const isActivity = order.orderType === '活动订单';

  return (
    <div className="od-page">
      {contextHolder}

      {/* ====== Top Action Bar ====== */}
      <div className="od-top-bar">
        <Breadcrumb items={[
          { title: <><HomeOutlined /> 首页</> },
          { title: '核算中心' },
          { title: <a onClick={onBack}>订单核算管理</a> },
          { title: <span style={{ color: '#1890ff' }}>订单详情</span> },
        ]} />
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回列表</Button>
          <Button icon={<EditOutlined />} onClick={() => handleAdjust('revenue')}>收入调整</Button>
          <Button icon={<SwapOutlined />} onClick={() => handleAdjust('rule')}>规则调整</Button>
          <Button icon={<ExportOutlined />} onClick={() => messageApi.info('导出功能开发中')}>导出</Button>
          <Button icon={<ReloadOutlined />} onClick={() => messageApi.success('已刷新')}>刷新</Button>
        </Space>
      </div>

      {/* ====== Order Base Info ====== */}
      <Card
        title={
          <Space>
            <span style={{ fontSize: 16, fontWeight: 600 }}>订单基础信息</span>
            <Tag color={statusColorMap[order.status]} style={{ fontSize: 13 }}>{order.status}</Tag>
            <Tag color="blue" style={{ fontSize: 13 }}>规则 {order.matchedRuleVersion}</Tag>
          </Space>
        }
        size="small"
        className="od-section-card"
      >
        <Descriptions bordered size="small" column={4} className="od-desc">
          {/* Common fields */}
          <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="买家姓名">{order.buyer}</Descriptions.Item>
          <Descriptions.Item label="买家编号">{order.buyerNo}</Descriptions.Item>
          <Descriptions.Item label="订单状态"><Tag color={statusColorMap[order.status]}>{order.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="订单金额"><span style={{ fontWeight: 700, color: '#f5222d' }}>¥{order.amount.toLocaleString()}</span></Descriptions.Item>
          <Descriptions.Item label="实际支付金额"><span style={{ fontWeight: 600 }}>¥{(order.actualPayAmount || 0).toLocaleString()}</span></Descriptions.Item>
          <Descriptions.Item label="退款金额">{order.refundAmount > 0 ? <span style={{ color: '#f5222d' }}>¥{order.refundAmount.toLocaleString()}</span> : '-'}</Descriptions.Item>
          <Descriptions.Item label="扣款比例">{order.deductionRatio ? `${(order.deductionRatio * 100).toFixed(0)}%` : '-'}</Descriptions.Item>
          <Descriptions.Item label="扣款金额">{order.deductionAmount > 0 ? <span style={{ color: '#f5222d' }}>¥{order.deductionAmount.toLocaleString()}</span> : '-'}</Descriptions.Item>
          <Descriptions.Item label="下单时间">{order.createTime}</Descriptions.Item>
          <Descriptions.Item label="支付完成时间">{order.payTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="下单时客户负责人">{order.employee}</Descriptions.Item>
          <Descriptions.Item label="负责人所属团队">{order.team}</Descriptions.Item>
          <Descriptions.Item label="部门">{order.department}</Descriptions.Item>
          <Descriptions.Item label="客户来源">{order.buyerSource}</Descriptions.Item>
          <Descriptions.Item label="订单类型">{order.orderType}</Descriptions.Item>

          {/* Activity order conditional fields */}
          {isActivity ? (
            <>
              <Descriptions.Item label="活动名称">{order.product}</Descriptions.Item>
              <Descriptions.Item label="活动邀约人">{order.activityInviter || '-'}</Descriptions.Item>
              <Descriptions.Item label="活动邀约人所属团队">{order.activityInviterTeam || '-'}</Descriptions.Item>
              <Descriptions.Item label="活动邀约人所属团队类型">{order.activityInviterTeamType || '-'}</Descriptions.Item>
              <Descriptions.Item label="活动主办方">{order.activityOrganizer || '-'}</Descriptions.Item>
              <Descriptions.Item label="活动类型">{order.activityType || '-'}</Descriptions.Item>
            </>
          ) : (
            <>
              <Descriptions.Item label="产品名称">{order.product}</Descriptions.Item>
              <Descriptions.Item label="产品类型">{order.productType}</Descriptions.Item>
              <Descriptions.Item label="产品归属">{order.productAttribution}</Descriptions.Item>
              <Descriptions.Item label="客户购买阶段">{order.purchaseStage}</Descriptions.Item>
              <Descriptions.Item label="成交方式">{order.tradeMethod}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      {/* ====== Revenue Statistics ====== */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>收入统计</span>}
        size="small"
        className="od-section-card"
      >
        {/* Summary Row */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title="总应确认金额"
              value={revenueBreakdown.totalToConfirm}
              prefix="¥"
              valueStyle={{ color: '#1890ff', fontSize: 22 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="待确认金额"
              value={revenueBreakdown.totalPending}
              prefix="¥"
              valueStyle={{ color: '#faad14', fontSize: 22 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="已确认金额"
              value={revenueBreakdown.totalConfirmed}
              prefix="¥"
              valueStyle={{ color: '#52c41a', fontSize: 22 }}
            />
          </Col>
        </Row>

        {/* Current Ratios */}
        <Descriptions size="small" column={4} bordered style={{ marginBottom: 16 }}>
          {revenueBreakdown.items.map((item) => (
            <Descriptions.Item key={item.key} label={`${item.name}比例`}>
              <Tag color={Object.values(revenueTypeColorMap)[['业务收入', '导流收入', '交付收入', '渠道分成'].indexOf(item.name)]}>
                {(item.ratio * 100).toFixed(0)}%
              </Tag>
            </Descriptions.Item>
          ))}
        </Descriptions>

        {/* Breakdown Table */}
        <Table
          dataSource={revenueBreakdown.items}
          rowKey="key"
          size="small"
          pagination={false}
          bordered
          columns={[
            {
              title: '收入类型', dataIndex: 'name', key: 'name', width: 120,
              render: (v) => <Tag color={revenueTypeColorMap[v]}>{v}</Tag>,
            },
            {
              title: '比例', dataIndex: 'ratio', key: 'ratio', width: 100, align: 'center',
              render: (v) => `${(v * 100).toFixed(0)}%`,
            },
            {
              title: '应确认金额', dataIndex: 'toConfirm', key: 'toConfirm', width: 140, align: 'right',
              render: (v) => <span style={{ fontWeight: 600 }}>¥{v.toLocaleString()}</span>,
            },
            {
              title: '待确认金额', dataIndex: 'pending', key: 'pending', width: 140, align: 'right',
              render: (v) => <span style={{ color: '#faad14', fontWeight: 600 }}>¥{v.toLocaleString()}</span>,
            },
            {
              title: '已确认金额', dataIndex: 'confirmed', key: 'confirmed', width: 140, align: 'right',
              render: (v) => <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{v.toLocaleString()}</span>,
            },
          ]}
          summary={(data) => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}><strong>合计</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <strong style={{ color: '#1890ff' }}>¥{data.reduce((s, r) => s + r.toConfirm, 0).toLocaleString()}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <strong style={{ color: '#faad14' }}>¥{data.reduce((s, r) => s + r.pending, 0).toLocaleString()}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <strong style={{ color: '#52c41a' }}>¥{data.reduce((s, r) => s + r.confirmed, 0).toLocaleString()}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* ====== Bottom Tabs ====== */}
      <Card size="small" className="od-section-card">
        <Tabs activeKey={detailTab} onChange={setDetailTab} size="small">

          {/* Tab: Rule Snapshot */}
          <TabPane tab={<span><HistoryOutlined /> 规则快照</span>} key="snapshot">
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

          {/* Tab: Payment & Delivery Records */}
          <TabPane tab={<span><CheckCircleOutlined /> 支付/交付记录</span>} key="payment">
            <Row gutter={16}>
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

          {/* Tab: Adjustment Records */}
          <TabPane tab={<span><SwapOutlined /> 调整记录</span>} key="adjustment">
            {orderAdjustments.length > 0 ? (
              <Table
                dataSource={orderAdjustments}
                rowKey="id"
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: '调整编号', dataIndex: 'id', key: 'id', width: 100 },
                  { title: '调整类型', dataIndex: 'type', key: 'type', width: 100, render: (v) => <Tag color="orange">{v}</Tag> },
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
    </div>
  );
}
```

---

### Task 3: 修改 App.jsx - 新增状态和导入

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 添加导入 OrderDetailPage（第 21 行后新增）**

在 `import './App.css';` 之前添加：

```js
import OrderDetailPage from './OrderDetailPage';
```

- [ ] **Step 2: 新增 `selectedOrderId` 状态（第 56 行后新增）**

在 `const [selectedOrder, setSelectedOrder] = useState(null);` 之后添加：

```js
const [selectedOrderId, setSelectedOrderId] = useState(null);
```

- [ ] **Step 3: 新增 `handleViewOrderDetail` 回调（第 148 行后新增）**

在 `handleSelectOrder` 回调之后添加：

```js
const handleViewOrderDetail = useCallback((orderNo) => {
  setSelectedOrderId(orderNo);
  setSelectedMenu('order-detail');
}, []);
```

- [ ] **Step 4: 新增 `handleBackFromDetail` 回调**

```js
const handleBackFromDetail = useCallback(() => {
  setSelectedMenu('order-accounting');
  setSelectedOrderId(null);
}, []);
```

- [ ] **Step 5: 在订单核算表格列末尾（第 323 行 `unconfirmedRevenue` 列之后）添加操作列**

在 `orderAccountingColumns` 数组最后一个元素（`unconfirmedRevenue` 列）后面添加：

```js
{
  title: '操作', key: 'action', width: 110, align: 'center', fixed: 'right',
  render: (_, record) => (
    <Button type="link" size="small" onClick={() => handleViewOrderDetail(record.orderNo)}>
      查看详情
    </Button>
  ),
},
```

- [ ] **Step 6: 新增 order-detail 页面分支渲染**

在 `{selectedMenu === 'order-accounting' && (...)}` 代码块之后，占位符代码块 `{!['revenue', 'order-accounting'].includes(selectedMenu) && (...)}` 之前，添加：

```jsx
{selectedMenu === 'order-detail' && selectedOrderId && (
  <OrderDetailPage orderId={selectedOrderId} onBack={handleBackFromDetail} />
)}
```

- [ ] **Step 7: 更新占位符条件，排除 order-detail**

将：

```js
{!['revenue', 'order-accounting'].includes(selectedMenu) && (
```

改为：

```js
{!['revenue', 'order-accounting', 'order-detail'].includes(selectedMenu) && (
```

---

### Task 4: 新增详情页样式

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: 在 `App.css` 末尾添加详情页样式**

```css
/* ========== Order Detail Page ========== */
.od-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.od-top-bar {
  background: #fff;
  border-radius: 6px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.od-top-bar .ant-breadcrumb {
  font-size: 13px;
}

.od-section-card {
  border-radius: 6px;
}

.od-section-card .ant-card-head-title {
  font-size: 16px !important;
}

.od-desc .ant-descriptions-item-label {
  width: 160px;
  font-size: 13px;
  color: #8c8c8c;
}

.od-desc .ant-descriptions-item-content {
  font-size: 13px;
}
```

---

### Task 5: 验证与测试

- [ ] **Step 1: 启动开发服务器**

Run: `cd 开发代码/accounting-demo && npm run dev`

Expected: Vite dev server starts, no compilation errors

- [ ] **Step 2: 验证订单核算表格**

1. 打开浏览器访问开发服务器地址
2. 点击侧边栏「订单核算管理」
3. 确认表格最后一列出现「查看详情」按钮
4. 表格其他列和筛选功能不受影响

- [ ] **Step 3: 验证课程订单详情页**

1. 点击课程订单行的「查看详情」
2. 确认面包屑显示：首页 / 核算中心 / 订单核算管理 / 订单详情
3. 确认订单基础信息展示通用字段 + 产品信息（产品名称、产品类型、产品归属、客户购买阶段、成交方式）
4. 确认收入统计模块展示：总应确认、待确认、已确认金额 + 比例 + 明细表
5. 确认 3 个 Tab 可切换，内容正确

- [ ] **Step 4: 验证活动订单详情页**

1. 返回列表，点击活动订单（如 ORD2024090004）的「查看详情」
2. 确认订单基础信息展示通用字段 + 活动信息（活动名称、活动邀约人、活动邀约人所属团队、活动邀约人所属团队类型、活动主办方、活动类型）

- [ ] **Step 5: 验证操作按钮**

1. 点击「返回列表」确认回到订单核算管理页面，筛选条件保留
2. 再次进入详情页，点击「收入调整」/「规则调整」确认弹窗正常
3. 点击「导出」确认提示"导出功能开发中"
4. 点击「刷新」确认提示"已刷新"
