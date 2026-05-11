export const pageMap = {
  'revenue': '收入核算',
  'order-accounting': '订单核算管理',
  'order-detail': '订单详情',
  'adjustment': '调整单',
};

export const pageSections = {
  'revenue': [
    {
      key: '筛选条件区域',
      fields: ['订单号', '所属团队', '团队区域', '产品类型', '员工姓名', '买家姓名', '产品搜索', '所属部门', '日期范围'],
    },
    { key: '订单列表+详情面板', fields: [] },
  ],
  'order-accounting': [
    {
      key: '核算表格',
      fields: ['订单号', '订单类型', '订单状态', '日期范围', '买家姓名', '产品信息', '产品类型', '客户来源', '规则名称'],
    },
  ],
  'order-detail': [
    { key: '整体布局', fields: [] },
    { key: '收入确认概览', fields: [] },
    { key: '收入核算明细Tab', fields: [] },
    { key: '规则快照Tab', fields: [] },
  ],
  'adjustment': [
    { key: '整页', fields: [] },
    {
      key: '基础信息',
      fields: ['申请人', '申请人对应ERP账号', '标题', '调整项目', '原始业务单号'],
    },
    { key: '订单规则模块', fields: [] },
    {
      key: '调整原因及审批',
      fields: ['调整原因', '指定审批人', '附件', '备注'],
    },
  ],
};

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
      prd: 'docs/adjustment-order-rules-prd.html',
      flow: 'flows/order-rule-flow.png',
    },
    'adj-module-linkage': {
      title: '调整单 — 三方联动 PRD',
      prd: 'docs/adjustment-order-rules-prd.html',
      flow: 'flows/revenue-main-flow.png',
    },
    'order-list-optimization': {
      title: '订单核算列表优化 PRD',
      prd: null,
      flow: null,
    },
  },
  marks: {
    // —— 收入核算页 ——
    'revenue-filter':           { page: 'revenue', section: '筛选条件区域',       version: '2.0', type: 'new',      label: '筛选条件区域',                    docKey: null },
    'revenue-list-detail':      { page: 'revenue', section: '订单列表+详情面板',  version: '2.1', type: 'new',      label: '收入核算页（列表+详情）',          docKey: null },
    // —— 订单核算管理页 ——
    'order-accounting-table':   { page: 'order-accounting', section: '核算表格',  version: '2.5', type: 'modified', label: '订单核算表格（列拆分+筛选优化）',   docKey: 'order-list-optimization' },
    // —— 订单详情页 ——
    'detail-split-layout':      { page: 'order-detail', section: '整体布局',      version: '2.1', type: 'modified', label: '订单详情 — 分栏布局',              docKey: null },
    'detail-revenue-overview':  { page: 'order-detail', section: '收入确认概览',   version: '2.0', type: 'new',      label: '收入确认概览',                     docKey: null },
    'detail-revenue-detail':    { page: 'order-detail', section: '收入核算明细Tab', version: '2.0', type: 'new',     label: '收入核算明细',                     docKey: null },
    'detail-rule-snapshot':     { page: 'order-detail', section: '规则快照Tab',    version: '2.0', type: 'new',      label: '规则快照',                         docKey: null },
    // —— 调整单（列表 + 申请表单） ——
    'adjustment-list':          { page: 'adjustment', section: '整页',            version: '2.1', type: 'new',      label: '调整单列表页',                     docKey: null },
    'adj-form-order-rule':      { page: 'adjustment', section: '订单规则模块',     version: '2.4', type: 'new',    label: '订单规则模块',                     docKey: 'adjustment-order-rule' },
    'adj-form-items':           { page: 'adjustment', section: '基础信息', field: '调整项目', version: '2.5', type: 'modified', label: '调整项目', docKey: null },
  },
};
