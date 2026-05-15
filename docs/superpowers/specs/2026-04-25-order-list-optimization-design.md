# 订单核算管理列表页优化设计

## 概述

修复订单核算管理列表页（App.jsx `orderAccountingColumns`）的收入比例显示问题，新增应确认收入列，并将订单类型和订单状态的筛选改为 Ant Design Table 列内筛选。

## 变更范围

仅修改 `开发代码/accounting-demo/src/App.jsx`。

## 设计详案

### 1. 业务收入比例拆分为两列

**位置：** `orderAccountingColumns` 中的"业务收入比例"列（约第293-299行）

**改动：** 原一列拆为两列：

```javascript
// 原：业务收入比例 → rule.rules.businessRatio (不存在，导致NaN)
// 改为：
{
  title: '业务收入1比例', key: 'biz1Ratio', width: 130, align: 'center',
  render: (_, record) => {
    const rule = ruleVersions.find(rv => rv.version === record.matchedRuleVersion);
    if (!rule || rule.rules.business1Ratio == null) return '-';
    return <Tag color="blue">{(rule.rules.business1Ratio * 100).toFixed(0)}%</Tag>;
  },
},
{
  title: '业务收入2比例', key: 'biz2Ratio', width: 130, align: 'center',
  render: (_, record) => {
    const rule = ruleVersions.find(rv => rv.version === record.matchedRuleVersion);
    if (!rule || rule.rules.business2Ratio == null) return '-';
    return <Tag color="blue">{(rule.rules.business2Ratio * 100).toFixed(0)}%</Tag>;
  },
},
```

导流收入比例、交付收入比例、渠道分成比例保持不变（已正确引用 `trafficRatio`/`deliveryRatio`/`channelRatio`），但加上 null 检查，无对应类型时显示 "-"。

### 2. 缺失类型显示"-"

所有比例列统一加 null 检查：
- `if (!rule || rule.rules.xxxRatio == null) return '-';`
- 规则不包含该收入类型时，ratioKey 不存在，显示 "-"

### 3. 新增"应确认收入金额"列

**位置：** 在"已确认收入"列之前插入

```javascript
{
  title: '应确认收入金额', key: 'toBeConfirmed', width: 140,
  render: (_, record) => {
    const amount = record.actualPayAmount - (record.refundAmount || 0);
    return <span style={{ fontWeight: 500 }}>¥{amount.toLocaleString()}</span>;
  },
},
```

### 4. 订单类型和订单状态改为列内筛选

**上方筛选栏改动：** 删除"订单类型"和"订单状态"的 Select 控件，保留订单号、买家姓名、产品类型、日期范围等筛选。

**列定义改动：**

```javascript
// 订单类型列
{
  title: '订单类型', dataIndex: 'orderType', width: 100,
  filters: [...new Set(orders.map(o => o.orderType))].map(v => ({ text: v, value: v })),
  onFilter: (value, record) => record.orderType === value,
},

// 订单状态列
{
  title: '订单状态', dataIndex: 'status', width: 110,
  filters: [...new Set(orders.map(o => o.status))].map(v => ({ text: v, value: v })),
  onFilter: (value, record) => record.status === value,
  render: (text) => <Tag color={statusColorMap[text] || 'default'}>{text}</Tag>,
},
```

**注意：** 列内筛选与上方筛选栏独立工作。Ant Design Table 的 `onFilter` 在外部 `dataSource` 过滤后再次过滤。需确保 `oaFilteredOrders` 的 useMemo 不再过滤订单类型和订单状态（改为由列内筛选处理）。

### 不变的部分

- 摘要统计卡片不变
- 其他表格列不变
- 订单详情页不变
- 调整单相关页面不变

## 验收标准

- [ ] 业务收入1比例和业务收入2比例各自独立成列，显示正确百分比
- [ ] 导流收入比例、交付收入比例、渠道分成比例显示正确
- [ ] 订单规则中不包含的收入类型显示 "-"
- [ ] "应确认收入金额"列显示在"已确认收入"前，值 = 实付金额 - 退款金额
- [ ] 订单类型列头有筛选图标，可按类型筛选
- [ ] 订单状态列头有筛选图标，可按状态筛选
- [ ] 上方筛选栏中不再有订单类型和订单状态的 Select
- [ ] 其他上方筛选（订单号、买家等）正常工作
