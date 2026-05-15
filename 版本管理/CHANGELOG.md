# 变更日志

所有项目变更均记录在此文件中，按时间倒序排列。

---

## [Unreleased]

### 新增
- 文档中心页面：演示模式下通过顶部导航栏入口打开新页签，按迭代版本汇总展示需求文档（左目录+右内容）和流程图（左列表+右预览），支持目录导航和缩放查看
- `src/App.jsx` — 订单核算管理列表页新增「批量调整规则」功能：勾选订单后批量切换规则版本，自动校验已生成收入比例，校验通过直接修改，失败提供 CSV 文件下载
- `src/mockData.js` — 新增 `batchUpdateOrderRules` 函数，封装批量规则调整的校验与修改逻辑

### 新增
- `src/demo/` — 迭代标记演示系统：DemoProvider（Context状态管理）、DemoToggle（开关+版本筛选）、IterationMark（区域级标记）、FieldMark（字段级标记）、DocDrawer（侧边抽屉PRD+流程图）
- `src/demo/iterations.js` — 迭代版本（2.0/2.1/2.4/2.5）和文档映射配置
- `src/demo/demo.css` — 演示标记系统样式（开关栏、标记徽章、字段高亮、抽屉）
- `src/main.jsx` — 接入 DemoProvider 包裹
- `src/App.jsx` — 收入核算页筛选区域、订单列表+详情面板、订单核算表格添加迭代标记
- `src/OrderDetailPage.jsx` — 订单详情页分栏布局、收入概览、核算明细、规则快照添加迭代标记
- `src/AdjustmentPage.jsx` — 调整单列表页整体添加迭代标记
- `src/App.jsx` — 订单核算列表页新增「应确认收入金额」列（实付金额 - 退款金额）
- `src/App.jsx` — 订单类型、订单状态改为表格列内筛选，移除上方对应筛选控件
- `src/AdjustmentFormPage.jsx` — 业务信息/交付信息模块根据调整项目选择条件显示
- `src/AdjustmentFormPage.jsx` — 业务信息/交付信息的项目下拉从订单规则模块动态读取，规则新增类型后下拉自动更新
- 创建项目目录结构：需求文档、设计文档、开发代码、版本管理
- 创建版本变更日志文件
- 使用 Vite + React 模板初始化前端项目 `开发代码/accounting-demo`（Vite v8.0.9, React）

### 修改
- `src/AdjustmentFormPage.jsx` — 移除旧迭代高亮代码（iterationChanges、Popover触发按钮、className标记），迁移到新的 DemoProvider + IterationMark/FieldMark 体系
- `src/App.css` — 移除旧迭代高亮 CSS（.af-iteration-* 系列），由 src/demo/demo.css 替代
- `src/App.jsx` — 订单核算列表页「业务收入比例」拆分为「业务收入1比例」和「业务收入2比例」两列，修复原 businessRatio 不存在的问题
- `src/App.jsx` — 收入比例列增加 null 检查，规则中不包含的收入类型显示"-"
- `src/AdjustmentFormPage.jsx` — 调整项目选项从5个独立项（业务收入1/2、导流收入、业务渠道分成、交付收入）改为4个基础类型（业务收入、导流收入、业务渠道分成、交付收入）
- `src/AdjustmentFormPage.jsx` + `src/App.css` — 调整单申请页「订单规则」模块样式与交互优化：
  - 顶部增加规则摘要区，集中展示规则名称、版本、生效状态、收入类型数量、比例合计与当前订单号
  - 开启规则调整时增加比例平衡提示，比例未到 100% 时用醒目状态提醒
  - 调整操作区改为独立工具栏，重置按钮在无变更时禁用，减少误操作
  - 规则表格新增行级高亮，清晰区分“已修改”和“新增”的收入类型
  - 优化卡片层次、圆角、描边和移动端换行表现，使模块更清晰、更适合连续编辑

## 2026-04-24

### 新增
- `src/AdjustmentFormPage.jsx` + `src/App.css` — 调整单申请页支持多订单选择与切换：
  - 原始业务单号从单选改为多选，弹窗中选择/取消切换
  - 已选订单以可点击标签展示，点击切换活跃订单，蓝色高亮+底部边框标识当前订单
  - 支持单个移除（×按钮）和清除全部
  - 切换活跃订单时自动刷新：关联订单信息、订单规则、业务信息已有项目、交付信息均联动更新
  - 新增 `.af-order-tag` / `.af-order-tag-active` / `.af-order-tag-close` 样式

### 新增
- `src/AdjustmentFormPage.jsx` + `src/App.css` — 调整单申请页新增「订单规则」展示区块：
  - 在关联订单信息和业务信息之间新增订单规则卡片，展示当前订单匹配的核算规则（规则名称、版本号）
  - 表格显示5种收入类型的名称、比例、归属团队，带彩色圆点标识
  - Switch 开关控制是否调整规则，开启后显示「原比例/原团队」灰色列和「调整后比例/调整后团队」浅蓝可编辑列
  - 新增收入类型功能：选择基础类型后自动编号（如已有业务收入1/2则新增为业务收入3）
  - 支持删除收入类型、重置为初始规则
  - 优化样式：header 分栏布局（左规则信息/右开关）、操作按钮区域独立行
  - 切换订单或关闭开关时自动重置编辑状态

### 修改
- `src/AdjustmentFormPage.jsx` + `src/App.css` — 交付信息模块布局修复：
  - 交付信息12个字段从 CSS Grid 改为 HTML table 表格形式（th/td 交替列，4组字段/行，共3行）
  - label 列灰色背景右对齐，value 列白色背景无边框输入框

### 修改
- `src/AdjustmentFormPage.jsx` + `src/App.css` — 按照易快报系统截图重构调整单申请页结构：
  - 基础信息：改为水平布局，一行一个字段（label在左、输入在右）
  - 区域顺序调整：关联订单信息移到业务信息上方
  - 交付信息：12个字段从平铺Form改为带边框的table表格形式（label列+value列交替）
  - 底部字段：调整原因/审批人/附件/备注改为一行一个，纵向排列
  - 区域分隔：去掉 border-top 横线分隔，改用块状卡片（白底+圆角边框）+浅灰页面背景
  - 统一字体大小为 14px（表格12px），保持页面视觉一致

## 2026-04-23

### 新增
- `src/AdjustmentPage.jsx` — 调整单列表页独立组件（复刻易快报系统已有功能），包含：
  - 筛选区域（调整单号、关联业务单号输入框 + 筛选/重置按钮）
  - 新增调整单按钮
  - 调整单列表表格（调整单号、调整项目、状态、关联业务单号、申请人、申请时间、审批通过时间、审批单号、操作列）
  - 查看详情 Modal 和操作日志 Timeline Modal
- `src/mockData.js` — 新增调整单模拟数据生成函数（68条记录），含 `getStoredAdjustmentOrders` / `saveAdjustmentOrders` 持久化方法
- `src/AdjustmentFormPage.jsx` — 调整单申请页（复刻易快报系统），纯白背景无Card边框，垂直堆叠布局：
  - 基础信息表单：申请人、ERP账号、标题、调整项目（多选标签）、原始业务单号（弹窗选择）
  - 业务信息区（蓝色左边框标题）+ 可编辑调整项目表格 + 关联订单信息表格
  - 交付信息区 + 交付信息表单（4列3行）+ 交付调整项目表格
  - 底部：调整原因、指定审批人、附件上传、备注、确认/取消按钮

### 修改
- `src/App.jsx` — 导入 AdjustmentPage 组件，新增 `adjustment` 菜单页面条件渲染，更新占位页排除列表
- `src/App.css` — 新增调整单页面样式（.adj-page）和调整单申请页样式（.adj-form-page）
- `src/AdjustmentPage.jsx` — 新增按钮点击后切换到申请表单页，提交后返回列表

### 修改
- `src/OrderDetailPage.jsx` — 订单核算详情页布局重构为左右分栏（方案B）：
  - 左侧 280px 窄栏：订单号/状态/金额头部 + 核心信息/产品信息/负责人与客户/匹配规则四个分区
  - 右侧主体区：核算统计卡片 + 底部 tabs（收入核算明细、规则快照、支付/交付记录、调整记录）
  - 核算统计卡片重新设计：总应确认/已确认/待确认三数汇总 + 总体进度条 + 5种收入类型各自带彩色进度条和确认金额
- `src/App.css` — 新增左右分栏布局样式和核算统计卡片样式（进度条、类型行等），移除旧 Collapse 布局和内联收入表格样式
- `src/mockData.js` — 收入类型从 4 种更新为 5 种：业务收入1、业务收入2、导流收入、业务渠道分成、交付收入。更新 ruleVersions 规则结构、calculateRevenueBreakdown、calculateRevenueFlows、calculateRevenues 函数

## 2026-04-22

### 设计文档
- 编写订单详情页设计文档 `设计文档/2026-04-22-order-detail-page-design.md`
- 编写订单详情页实现计划 `设计文档/2026-04-22-order-detail-page-plan.md`

### 新增
- 新建 `src/OrderDetailPage.jsx` — 订单详情页独立组件，包含：
  - 顶部操作栏（面包屑导航 + 返回/收入调整/规则调整/导出/刷新按钮）
  - 订单基础信息卡（Descriptions 4列带边框，区分活动订单和非活动订单条件字段）
  - 收入统计模块（3个汇总卡片 + 当前比例展示 + 分项收入明细表含合计行）
  - 底部 Tab 区域（规则快照 Timeline、支付/交付记录双栏表格、调整记录表格）
  - 收入调整与规则调整 Modal 弹窗

### 修改
- `src/mockData.js` — 新增 `calculateRevenueBreakdown` 函数，根据订单状态计算各收入类型的应确认/待确认/已确认金额
- `src/App.jsx` — 新增 `selectedOrderId` 状态、`handleViewOrderDetail` / `handleBackFromDetail` 回调、订单核算表格操作列（查看详情按钮）、`order-detail` 页面分支渲染
- `src/App.css` — 新增订单详情页样式（.od-page / .od-top-bar / .od-section-card / .od-desc）

---

> **格式说明：**
>
> 每次变更按以下格式记录：
>
> ## [版本号] - YYYY-MM-DD
>
> ### 新增 / 修改 / 修复 / 移除
> - 变更描述
