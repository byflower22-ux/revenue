export const iterations = {
  versions: [
    { key: '2.0', label: '2.0迭代', date: '04-22' },
    { key: '2.1', label: '2.1迭代', date: '04-23' },
    { key: '2.4', label: '2.4迭代', date: '04-24' },
    { key: '2.5', label: '2.5迭代', date: '04-25' },
  ],
  docs: {
    'adjustment-order-rule': {
      title: '调整单 — 订单规则模块 PRD',
      prd: '需求文档/2026-04-25-adjustment-order-rules-prd',
      flow: null,
    },
    'adj-module-linkage': {
      title: '调整单 — 三方联动 PRD',
      prd: '需求文档/2026-04-25-adjustment-order-rules-prd',
      flow: null,
    },
    'order-list-optimization': {
      title: '订单核算列表优化 PRD',
      prd: null,
      flow: null,
    },
  },
  // 所有标记点集中定义，修改此处即可联动页面标记
  marks: {
    // —— 收入核算页 (App.jsx) ——
    'revenue-filter':           { version: '2.0', type: 'new',      label: '筛选条件区域',                    docKey: null },
    'revenue-list-detail':      { version: '2.1', type: 'new',      label: '收入核算页（列表+详情）',          docKey: null },
    // —— 订单核算管理页 (App.jsx) ——
    'order-accounting-table':   { version: '2.5', type: 'modified', label: '订单核算表格（列拆分+筛选优化）',   docKey: 'order-list-optimization' },
    // —— 订单详情页 (OrderDetailPage.jsx) ——
    'detail-split-layout':      { version: '2.1', type: 'modified', label: '订单详情 — 分栏布局',              docKey: null },
    'detail-revenue-overview':  { version: '2.0', type: 'new',      label: '收入确认概览',                     docKey: null },
    'detail-revenue-detail':    { version: '2.0', type: 'new',      label: '收入核算明细',                     docKey: null },
    'detail-rule-snapshot':     { version: '2.0', type: 'new',      label: '规则快照',                         docKey: null },
    // —— 调整单列表页 (AdjustmentPage.jsx) ——
    'adjustment-list':          { version: '2.1', type: 'new',      label: '调整单列表页',                     docKey: null },
    // —— 调整单表单页 (AdjustmentFormPage.jsx) ——
    'adj-form-order-rule':      { version: '2.4', type: 'new',      label: '订单规则模块',                     docKey: 'adjustment-order-rule' },
    'adj-form-items':           { version: '2.5', type: 'modified', label: '调整项目',                         docKey: null },
  },
};
