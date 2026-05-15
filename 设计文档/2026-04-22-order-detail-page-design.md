# 订单核算管理 - 订单详情页设计

## 概述

在订单核算管理模块中增加独立详情页，点击订单表格行进入，展示订单完整的核算信息。

## 技术方案

提取为独立组件 `OrderDetailPage.jsx`，在 `App.jsx` 中通过 `selectedMenu === 'order-detail'` 条件渲染。状态通过 props 传递：订单 ID、mock 数据、回调函数。

## 页面结构

### 1. 顶部操作栏

- 面包屑：核算中心 / 订单核算管理 / 订单详情
- 按钮组：返回列表 | 收入调整 | 规则调整 | 导出 | 刷新

### 2. 订单基础信息卡（Descriptions 4列带边框）

**通用字段（所有订单）：**
| 字段 | 数据来源 |
|------|---------|
| 订单号 | order.orderNo |
| 买家姓名 | order.buyer |
| 买家编号 | order.buyerNo |
| 下单时间 | order.createTime |
| 支付完成时间 | order.payTime |
| 订单状态 | order.status |
| 订单金额 | order.amount |
| 实际支付金额 | order.actualPayAmount |
| 退款金额 | order.refundAmount |
| 扣款比例 | order.deductionRatio |
| 扣款金额 | order.deductionAmount |
| 下单时客户负责人 | order.employee |
| 负责人所属团队 | order.team |
| 部门 | order.department |

**条件字段 - 活动订单（orderType === '活动订单'）：**
| 字段 | 数据来源 |
|------|---------|
| 活动名称 | order.product（活动订单的产品字段存活动名） |
| 活动邀约人 | order.activityInviter |
| 活动邀约人所属团队 | order.activityInviterTeam |
| 活动邀约人所属团队类型 | order.activityInviterTeamType |
| 活动主办方 | order.activityOrganizer |
| 活动类型 | order.activityType |

**条件字段 - 非活动订单：**
| 字段 | 数据来源 |
|------|---------|
| 产品名称 | order.product |
| 产品类型 | order.productType |
| 产品归属 | order.productAttribution |
| 客户购买阶段 | order.purchaseStage |
| 成交方式 | order.tradeMethod |

### 3. 收入统计模块

**顶部汇总行（3个 Statistic 卡片）：**
- 总应确认金额
- 待确认金额
- 已确认金额

**当前收入比例（Descriptions 展示）：**
- 业务收入比例
- 导流收入比例
- 交付收入比例
- 渠道分成比例

**分项收入明细表（Table）：**

| 列 | 说明 |
|----|------|
| 收入类型 | 业务收入/导流收入/交付收入/渠道分成 |
| 比例 | 对应比例值 |
| 应确认金额 | 按比例计算的应收金额 |
| 待确认金额 | 未确认部分 |
| 已确认金额 | 已确认部分 |
| 合计行 | 底部汇总 |

数据来源：`calculateRevenues(order)` 的计算结果。

### 4. 底部 Tab 区域

**Tab 1 - 规则快照：**
- 当前匹配规则版本标签（Tag）
- Timeline 组件展示版本历史
  - 每个节点：版本标签、比例描述、生效时间
- 数据来源：`ruleSnapshots`（按 orderNo 过滤）

**Tab 2 - 支付/交付记录：**
- 左右两列并排
- 左：支付记录表 — 支付单号、支付方式、支付金额、支付时间、状态
- 右：交付记录表 — 交付单号、交付内容、交付时间、状态
- 数据来源：`payments`、`deliveries`（按 orderNo 过滤）

**Tab 3 - 调整记录：**
- 新增调整按钮
- 调整记录表 — 调整类型、调整前、调整后、调整原因、操作人、操作时间
- 空状态显示"暂无调整记录"
- 数据来源：`adjustments`（按 orderNo 过滤）

## 交互流程

### 进入详情页
- 订单核算表格每行增加「查看详情」操作按钮（最后一列）
- 点击后 `selectedMenu` 切换到 `order-detail`，`selectedOrderId` 记录当前订单 ID

### 顶部按钮行为
| 按钮 | 行为 |
|------|------|
| 返回列表 | `selectedMenu` 切回 `order-accounting`，保留之前的筛选条件 |
| 收入调整 | 弹出 Modal，填写调整金额和原因，提交后写入 adjustments |
| 规则调整 | 弹出 Modal，选择新规则版本，提交后写入 adjustments |
| 导出 | 当前阶段 mock，提示"功能开发中" |
| 刷新 | 重新渲染当前订单数据 |

### 状态管理
- `App.jsx` 新增 `selectedMenu: 'order-detail'` 分支
- `selectedOrderId` 状态（useState）
- 通过 props 向 `OrderDetailPage` 传递：订单数据、回调函数（onBack、onAdjust 等）
- 调整操作通过回调函数与 App 通信，实际数据修改仍在 App 层

## 文件变更清单

| 文件 | 变更 |
|------|------|
| `src/OrderDetailPage.jsx` | **新建** — 详情页独立组件 |
| `src/App.jsx` | **修改** — 新增 order-detail 分支、selectedOrderId 状态、表格增加查看详情按钮 |
| `src/App.css` | **修改** — 新增详情页样式 |
| `src/mockData.js` | **修改** — 可能需要补充收入确认状态的模拟数据 |
