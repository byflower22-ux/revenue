# 批量调整规则功能 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在订单核算管理列表页新增勾选订单、批量切换规则版本功能，含收入比例校验、失败文件下载。

**Architecture:** 在 `mockData.js` 新增校验+批量修改函数，在 `App.jsx` 新增批量调整 Modal 和结果 Modal 组件，利用 antd Table 的 `rowSelection` 实现行选择。

**Tech Stack:** React 19, Ant Design 6, localStorage 持久化

---

## File Structure

| File | Responsibility |
|------|---------------|
| `mockData.js` | 新增 `batchUpdateOrderRules()` 校验+修改函数 |
| `App.jsx` | 新增状态、rowSelection、批量调整 Modal、结果 Modal |
| `App.css` | 批量调整弹窗样式 |

---

### Task 1: mockData.js — 新增 `batchUpdateOrderRules` 函数

**Files:**
- Modify: `src/mockData.js` (文件末尾，约第 900 行后追加)

- [ ] **Step 1: 在 mockData.js 末尾添加 `batchUpdateOrderRules` 函数**

在文件最后一个 export 之后追加：

```js
/**
 * 批量调整订单规则版本
 * @param {string[]} orderNos - 要调整的订单号数组
 * @param {string} newRuleVersion - 目标规则版本号（如 'v3'）
 * @returns {{ success: string[], failed: { orderNo: string, oldVersion: string, newVersion: string, reason: string }[] }}
 */
export function batchUpdateOrderRules(orderNos, newRuleVersion) {
  const newRule = ruleVersions.find((rv) => rv.version === newRuleVersion);
  if (!newRule) return { success: [], failed: orderNos.map(no => ({ orderNo: no, oldVersion: '', newVersion: newRuleVersion, reason: '目标规则不存在' })) };

  const orders = getStoredOrders();
  const successList = [];
  const failedList = [];

  const ratioKeys = [
    { key: 'business1Ratio', name: '业务收入1' },
    { key: 'business2Ratio', name: '业务收入2' },
    { key: 'trafficRatio', name: '导流收入' },
    { key: 'channelRatio', name: '业务渠道分成' },
    { key: 'deliveryRatio', name: '交付收入' },
  ];

  orderNos.forEach((orderNo) => {
    const order = orders.find((o) => o.orderNo === orderNo);
    if (!order) {
      failedList.push({ orderNo, oldVersion: '-', newVersion: newRuleVersion, reason: '订单不存在' });
      return;
    }

    const oldVersion = order.matchedRuleVersion;
    const oldRule = ruleVersions.find((rv) => rv.version === oldVersion);

    if (!oldRule) {
      failedList.push({ orderNo, oldVersion, newVersion: newRuleVersion, reason: '原规则不存在' });
      return;
    }

    // 获取收入明细
    const breakdown = calculateRevenueBreakdown(order);
    const mismatchReasons = [];

    ratioKeys.forEach(({ key, name }) => {
      const item = breakdown.items.find((i) => i.key === key);
      if (item && item.confirmed !== 0) {
        const oldRatio = oldRule.rules[key];
        const newRatio = newRule.rules[key];
        if (oldRatio !== newRatio) {
          mismatchReasons.push(`${name}比例不一致: 当前${(oldRatio * 100).toFixed(0)}%, 目标${(newRatio * 100).toFixed(0)}%`);
        }
      }
    });

    if (mismatchReasons.length > 0) {
      failedList.push({
        orderNo,
        oldVersion,
        newVersion: newRuleVersion,
        reason: mismatchReasons.join('; '),
      });
      return;
    }

    // 校验通过，修改订单
    const idx = orders.findIndex((o) => o.orderNo === orderNo);
    orders[idx] = {
      ...orders[idx],
      matchedRuleVersion: newRuleVersion,
      matchedRuleId: newRule.id,
    };
    successList.push(orderNo);
  });

  saveOrders(orders);
  return { success: successList, failed: failedList };
}
```

- [ ] **Step 2: 验证函数可正常导出**

在浏览器开发者工具控制台检查 `batchUpdateOrderRules` 无语法错误。启动开发服务器确认页面正常加载。

- [ ] **Step 3: Commit**

```bash
git add src/mockData.js
git commit -m "feat: add batchUpdateOrderRules function for batch rule adjustment with validation"
```

---

### Task 2: App.jsx — 新增批量调整相关状态和 import

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 更新 import 语句**

在 `App.jsx` 第 18-21 行的 import 中，添加 `batchUpdateOrderRules` 和 `calculateRevenueBreakdown`：

```js
import {
  orders, payments, deliveries, ruleVersions, ruleSnapshots,
  calculateRevenues, calculateRevenueBreakdown, adjustments, addAdjustment,
  getStoredOrders, getStoredAdjustments, batchUpdateOrderRules,
} from './mockData';
```

- [ ] **Step 2: 添加 antd Checkbox 和 DownloadOutlined import**

在 antd import（第 3-6 行）中追加 `Checkbox`：

```js
import {
  Layout, Menu, Table, Tabs, Button, Tag, Space, Input, Select, DatePicker,
  Breadcrumb, Card, Descriptions, Timeline, Modal, Form, InputNumber,
  message, Divider, Badge, Tooltip, Popconfirm, Row, Col, Statistic, Checkbox,
} from 'antd';
```

在 icons import（第 8-15 行）中追加 `DownloadOutlined`：

```js
import {
  DashboardOutlined, SettingOutlined, AccountBookOutlined,
  OrderedListOutlined, MoneyCollectOutlined, SwapOutlined,
  FileTextOutlined, HistoryOutlined, EditOutlined, PlusOutlined,
  SearchOutlined, ReloadOutlined, ExportOutlined, DownOutlined,
  UpOutlined, HomeOutlined, FolderOutlined, TeamOutlined,
  UnorderedListOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
```

- [ ] **Step 3: 添加批量调整相关 state**

在 `App` 函数内，`oaFilterExpanded` state 之后（约第 94 行后）追加：

```js
  // Batch adjust rules
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchAdjustVisible, setBatchAdjustVisible] = useState(false);
  const [batchTargetRule, setBatchTargetRule] = useState(null);
  const [batchResultVisible, setBatchResultVisible] = useState(false);
  const [batchResult, setBatchResult] = useState({ success: [], failed: [] });
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add batch adjust state and imports"
```

---

### Task 3: App.jsx — 添加 rowSelection 和批量调整按钮

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 定义 rowSelection 配置**

在 `orderAccountingColumns` 定义之前（约第 271 行前）追加：

```js
  const oaRowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };
```

- [ ] **Step 2: 在订单核算表格的 Card extra 区域添加批量调整按钮**

修改订单核算表格 Card 的 `extra`（第 1004-1008 行），将：

```jsx
extra={
  <Space>
    <Button icon={<ExportOutlined />}>导出</Button>
    <Button icon={<ReloadOutlined />}>刷新</Button>
  </Space>
}
```

替换为：

```jsx
extra={
  <Space>
    {selectedRowKeys.length > 0 && (
      <span style={{ color: '#1890ff', fontSize: 13 }}>
        已选 {selectedRowKeys.length} 项
      </span>
    )}
    <Button
      type="primary"
      icon={<SwapOutlined />}
      disabled={selectedRowKeys.length === 0}
      onClick={() => setBatchAdjustVisible(true)}
    >
      批量调整规则
    </Button>
    <Button icon={<ExportOutlined />}>导出</Button>
    <Button icon={<ReloadOutlined />}>刷新</Button>
  </Space>
}
```

- [ ] **Step 3: 在 Table 组件添加 rowSelection**

修改订单核算 Table（约第 1013 行），在 `<Table` 属性中添加 `rowSelection`：

```jsx
<Table
  dataSource={oaFilteredOrders}
  columns={orderAccountingColumns}
  rowKey="orderNo"
  rowSelection={oaRowSelection}
  size="middle"
  scroll={{ x: 5330, y: 600 }}
  ...
```

- [ ] **Step 4: 启动开发服务器验证**

确认列表页左侧出现 checkbox 列，勾选后显示已选数量和批量调整按钮，未勾选时按钮 disabled。

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add row selection and batch adjust button to order accounting table"
```

---

### Task 4: App.jsx — 批量调整 Modal（选规则+规则详情表格）

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 在订单核算区域 `</div>` 结束标签后、`order-detail` 区域前插入批量调整 Modal**

在第 1031 行 `)}` (order-accounting 结束) 和第 1033 行 `{selectedMenu === 'order-detail'` 之间插入：

```jsx
          {/* Batch Adjust Rules Modal */}
          <Modal
            title="批量调整规则"
            open={batchAdjustVisible}
            onCancel={() => { setBatchAdjustVisible(false); setBatchTargetRule(null); }}
            width={1000}
            footer={[
              <Button key="cancel" onClick={() => { setBatchAdjustVisible(false); setBatchTargetRule(null); }}>取消</Button>,
              <Button key="submit" type="primary" disabled={!batchTargetRule} onClick={handleBatchAdjust}>确认调整</Button>,
            ]}
          >
            {/* Selected orders */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>已选订单（{selectedRowKeys.length}条）</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {selectedRowKeys.map((no) => (
                  <Tag key={no} closable onClose={() => setSelectedRowKeys(prev => prev.filter(k => k !== no))}>{no}</Tag>
                ))}
              </div>
            </div>

            {/* Rule version select */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>选择目标规则版本</div>
              <Select
                style={{ width: '100%' }}
                placeholder="请选择规则版本"
                value={batchTargetRule}
                onChange={(v) => setBatchTargetRule(v)}
              >
                {ruleVersions.map((rv) => (
                  <Select.Option key={rv.version} value={rv.version}>
                    {rv.name} ({rv.status})
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Rule detail table */}
            {batchTargetRule && (() => {
              const rule = ruleVersions.find((rv) => rv.version === batchTargetRule);
              if (!rule) return null;
              const r = rule.rules;
              return (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>规则详情</div>
                  <div style={{ border: '1px solid #e8e8e8', borderRadius: 4, overflow: 'auto', maxHeight: 260 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
                      <thead>
                        <tr style={{ background: '#fafafa', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>条件</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>订单类型</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>产品</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>来源</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>业务收入1</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>归属团队</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>业务收入2</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>归属团队</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>导流收入</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>归属团队</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>渠道分成</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>归属团队</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>交付收入</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #eee' }}>归属团队</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rule.conditions.map((cond, i) => (
                          <tr key={i}>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', textAlign: 'center' }}>{i + 1}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee' }}>{cond.orderType}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee' }}>{cond.product}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee' }}>{cond.source}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', textAlign: 'right', color: '#1890ff' }}>{(r.business1Ratio * 100).toFixed(0)}%</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', color: '#666' }}>{r.business1Team}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', textAlign: 'right', color: '#1890ff' }}>{(r.business2Ratio * 100).toFixed(0)}%</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', color: '#666' }}>{r.business2Team}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', textAlign: 'right', color: '#52c41a' }}>{(r.trafficRatio * 100).toFixed(0)}%</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', color: '#666' }}>{r.trafficTeam}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', textAlign: 'right', color: '#fa8c16' }}>{(r.channelRatio * 100).toFixed(0)}%</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', color: '#666' }}>{r.channelTeam}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', textAlign: 'right', color: '#722ed1' }}>{(r.deliveryRatio * 100).toFixed(0)}%</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #eee', color: '#666' }}>{r.deliveryTeam}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </Modal>
```

- [ ] **Step 2: 添加 `handleBatchAdjust` 回调函数**

在 `handleResetOaFilters` 函数之后（约第 200 行左右，在 `orderAccountingColumns` 定义之前）追加：

```js
  const handleBatchAdjust = useCallback(() => {
    if (!batchTargetRule || selectedRowKeys.length === 0) return;
    const result = batchUpdateOrderRules([...selectedRowKeys], batchTargetRule);
    setBatchResult(result);
    setBatchAdjustVisible(false);
    setBatchResultVisible(true);
    setBatchTargetRule(null);
    setSelectedRowKeys([]);
  }, [batchTargetRule, selectedRowKeys]);
```

- [ ] **Step 3: 启动开发服务器验证**

勾选订单 → 点击批量调整规则 → 弹窗显示已选订单标签 → 选择规则版本 → 下方显示完整规则详情表格 → 取消可关闭弹窗。

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add batch adjust rules modal with rule detail table"
```

---

### Task 5: App.jsx — 结果 Modal（执行结果 + 失败文件下载）

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 在批量调整 Modal 之后插入结果 Modal**

在 Task 4 插入的批量调整 Modal 的 `</Modal>` 之后、`{selectedMenu === 'order-detail'` 之前插入：

```jsx
          {/* Batch Adjust Result Modal */}
          <Modal
            title="批量调整结果"
            open={batchResultVisible}
            onCancel={() => setBatchResultVisible(false)}
            footer={[
              <Button key="close" type="primary" onClick={() => setBatchResultVisible(false)}>关闭</Button>,
            ]}
            width={700}
          >
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, padding: '8px 10px', marginBottom: 10, fontSize: 13 }}>
              <b>调整完成！</b> 成功 <b style={{ color: '#52c41a' }}>{batchResult.success.length}</b> 条，失败 <b style={{ color: '#ff4d4f' }}>{batchResult.failed.length}</b> 条
            </div>
            {batchResult.failed.length > 0 && (
              <div style={{ background: '#fff2e8', border: '1px solid #ffd591', borderRadius: 4, padding: '8px 10px', marginBottom: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>部分订单调整失败：</span>
                  <a onClick={handleDownloadFailedFile} style={{ color: '#1890ff', cursor: 'pointer' }}>
                    <DownloadOutlined /> 下载失败文件
                  </a>
                </div>
                <div style={{ marginTop: 4, color: '#999', fontSize: 11 }}>文件包含：订单号、原规则版本、目标规则版本、失败原因</div>
              </div>
            )}
            <Table
              dataSource={[
                ...batchResult.success.map((no) => ({ orderNo: no, result: 'success', oldVersion: '', newVersion: '' })),
                ...batchResult.failed.map((f) => ({ orderNo: f.orderNo, result: 'failed', oldVersion: f.oldVersion, newVersion: f.newVersion, reason: f.reason })),
              ]}
              columns={[
                { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
                { title: '调整结果', key: 'result', width: 100, render: (_, r) => r.result === 'success'
                  ? <span style={{ color: '#52c41a', fontWeight: 'bold' }}>✓ 成功</span>
                  : <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>✗ 失败</span>
                },
                { title: '说明', key: 'desc', render: (_, r) => {
                  if (r.result === 'success') return `${r.oldVersion || ''} → ${batchTargetRule || ''}`;
                  return <span style={{ color: '#ff4d4f' }}>{r.reason}</span>;
                }},
              ]}
              rowKey="orderNo"
              size="small"
              pagination={false}
            />
          </Modal>
```

- [ ] **Step 2: 添加 `handleDownloadFailedFile` 回调函数**

在 `handleBatchAdjust` 函数之后追加：

```js
  const handleDownloadFailedFile = useCallback(() => {
    const header = '订单号,原规则版本,目标规则版本,失败原因';
    const rows = batchResult.failed.map((f) =>
      `${f.orderNo},${f.oldVersion},${f.newVersion},"${f.reason}"`
    );
    const csv = '﻿' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `批量调整失败明细_${dayjs().format('YYYYMMDDHHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [batchResult]);
```

注意：`dayjs` 已在文件顶部 import。

- [ ] **Step 3: 启动开发服务器验证**

勾选订单 → 批量调整 → 选规则 → 确认 → 结果弹窗显示成功/失败数量 → 失败时有下载链接 → 点击下载生成 CSV → 关闭弹窗后列表刷新（选中清空）。

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add batch adjust result modal with failed file download"
```

---

### Task 6: 集成验证 + CHANGELOG

**Files:**
- Modify: `版本管理/CHANGELOG.md`

- [ ] **Step 1: 完整功能验证**

在浏览器中执行以下场景：
1. 未勾选时批量按钮 disabled
2. 勾选 2-3 条订单 → 点击批量调整 → 弹窗显示订单标签
3. 选择规则版本 → 下方展示完整规则详情表格
4. 取消弹窗 → 状态正确重置
5. 确认调整 → 结果弹窗显示成功/失败
6. 有失败时 → 点击下载 → CSV 内容正确
7. 关闭结果弹窗 → 列表数据刷新，勾选清空

- [ ] **Step 2: 更新 CHANGELOG**

在 `版本管理/CHANGELOG.md` 文件顶部追加新版本记录：

```markdown
## [版本号] - 2026-05-11

### 新增
- 订单核算管理列表页新增「批量调整规则」功能
  - 支持勾选多条订单批量切换规则版本
  - 自动校验已生成收入比例与新规则是否一致
  - 校验通过的订单直接修改，失败的提供 CSV 文件下载
  - 弹窗展示完整规则详情表格（条件 × 比例 × 归属团队）
```

- [ ] **Step 3: Final commit**

```bash
git add 版本管理/CHANGELOG.md
git commit -m "docs: update CHANGELOG for batch adjust rules feature"
```
