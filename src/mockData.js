import dayjs from 'dayjs';

// ========== localStorage 持久化 ==========
const STORAGE_KEYS = {
  ORDERS: 'accounting_orders',
  ADJUSTMENTS: 'accounting_adjustments',
};

function initStorage() {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(defaultOrders));
  localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify([]));
}

export function getStoredOrders() {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS));
}

export function saveOrders(newOrders) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(newOrders));
}

export function getStoredAdjustments() {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS));
}

export function saveAdjustments(newAdjustments) {
  localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(newAdjustments));
}

export function updateOrder(orderNo, updates) {
  const stored = getStoredOrders();
  const idx = stored.findIndex((o) => o.orderNo === orderNo);
  if (idx !== -1) {
    stored[idx] = { ...stored[idx], ...updates };
    saveOrders(stored);
  }
  return stored;
}

export function resetStorage() {
  localStorage.removeItem(STORAGE_KEYS.ORDERS);
  localStorage.removeItem(STORAGE_KEYS.ADJUSTMENTS);
}

// ========== 规则版本 ==========
export const ruleVersions = [
  {
    id: 'rv1',
    version: 'v1',
    name: '特训营收入分配规则 v1',
    effectiveDate: '2024-01-01',
    expireDate: '2024-06-30',
    status: '已失效',
    createdBy: 'B00001',
    createdAt: '2024-01-01 10:00:00',
    rules: {
      business1Ratio: 0.35,
      business1Team: '下单时客户负责人所属团队',
      business2Ratio: 0.10,
      business2Team: '博商管理',
      trafficRatio: 0.15,
      trafficTeam: '导流团队',
      deliveryRatio: 0.55,
      deliveryTeam: '班级交付团队',
      channelRatio: -0.15,
      channelTeam: '下单时客户负责人所属团队',
    },
    conditions: [
      { orderType: '产品课程', product: '咨询', source: '全部' },
      { orderType: '产品课程', product: '定制咨询', source: '全部' },
    ],
  },
  {
    id: 'rv2',
    version: 'v2',
    name: '特训营收入分配规则 v2',
    effectiveDate: '2024-07-01',
    expireDate: '2024-12-31',
    status: '已失效',
    createdBy: 'B00002',
    createdAt: '2024-06-15 14:30:00',
    rules: {
      business1Ratio: 0.35,
      business1Team: '下单时客户负责人所属团队',
      business2Ratio: 0.10,
      business2Team: '博商管理',
      trafficRatio: 0.15,
      trafficTeam: '导流团队',
      deliveryRatio: 0.55,
      deliveryTeam: '班级交付团队',
      channelRatio: -0.15,
      channelTeam: '下单时客户负责人所属团队',
    },
    conditions: [
      { orderType: '产品课程', product: '咨询', source: '全部' },
      { orderType: '产品课程', product: '定制咨询', source: '全部' },
      { orderType: '活动门票', product: '定制咨询', source: '全部' },
    ],
  },
  {
    id: 'rv3',
    version: 'v3',
    name: '特训营收入分配规则 v3',
    effectiveDate: '2025-01-01',
    expireDate: '2030-12-31',
    status: '生效中',
    createdBy: 'B00001',
    createdAt: '2024-12-20 09:00:00',
    rules: {
      business1Ratio: 0.35,
      business1Team: '下单时客户负责人所属团队',
      business2Ratio: 0.10,
      business2Team: '博商管理',
      trafficRatio: 0.15,
      trafficTeam: '导流团队',
      deliveryRatio: 0.55,
      deliveryTeam: '班级交付团队',
      channelRatio: -0.15,
      channelTeam: '下单时客户负责人所属团队',
    },
    conditions: [
      { orderType: '产品课程', product: '咨询', source: '全部' },
      { orderType: '产品课程', product: '定制咨询', source: '全部' },
      { orderType: '活动门票', product: '定制咨询', source: '全部' },
      { orderType: '卡项订单', product: '定制咨询', source: '全部' },
    ],
  },
];

function resolveRevenueTeam(order, revenueKey, configuredTeam) {
  return configuredTeam;
}

// ========== 订单数据（初始数据） ==========
const defaultOrders = [
  {
    id: 'ORD2024010001',
    orderNo: 'ORD2024010001',
    orderType: '产品课程',
    product: '咨询-企业管理',
    productType: '咨询',
    buyer: '张三',
    buyerNo: 'B10001',
    buyerSource: '线上推广',
    team: '赫柏队',
    teamRegion: '博商深圳',
    department: '深圳教务',
    employee: '李四',
    employeeNo: 'E2001',
    amount: 29800,
    status: '已完成',
    purchaseStage: '新购',
    tradeMethod: '单独成交',
    createTime: '2024-03-15 09:30:00',
    payTime: '2024-03-15 09:35:00',
    deliveryTime: '2024-03-16 10:00:00',
    revenueConfirmTime: '2024-03-15 09:35:00',
    activityTeam: '',
    activityTeamType: '',
    activityInviter: '',
    activityInviterTeam: '',
    activityInviterTeamType: '',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '新购',
    memberBatch: '',
    deliveryCompanyName: '',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/公开课',
    deductionRatio: 0,
    deductionAmount: 0,
    actualPayAmount: 29800,
    refundAmount: 0,
    matchedRuleVersion: 'v1',
    matchedRuleId: 'rv1',
  },
  {
    id: 'ORD2024020002',
    orderNo: 'ORD2024020002',
    orderType: '合作方交付',
    product: '定制咨询-战略规划',
    productType: '定制咨询',
    buyer: '王五',
    buyerNo: 'B10002',
    buyerSource: '渠道推荐',
    team: '大客户经理二组',
    teamRegion: '博商深圳',
    department: '全域线下',
    employee: '赵六',
    employeeNo: 'E2002',
    amount: 15800,
    status: '已完成',
    purchaseStage: '增购',
    tradeMethod: '配合成交',
    createTime: '2024-05-20 14:00:00',
    payTime: '2024-05-20 14:30:00',
    deliveryTime: '2024-05-22 09:00:00',
    revenueConfirmTime: '2024-05-20 14:30:00',
    activityTeam: '大客户经理二组',
    activityTeamType: '导流合作',
    activityInviter: '张推广',
    activityInviterTeam: '大客户经理二组',
    activityInviterTeamType: '外部合作',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '增购',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/试听课',
    deductionRatio: 0.05,
    deductionAmount: 790,
    actualPayAmount: 15800,
    refundAmount: 0,
    matchedRuleVersion: 'v1',
    matchedRuleId: 'rv1',
  },
  {
    id: 'ORD2024080003',
    orderNo: 'ORD2024080003',
    orderType: '项目合同',
    product: '咨询-领导力',
    productType: '咨询',
    buyer: '钱七',
    buyerNo: 'B10003',
    buyerSource: '线下活动',
    team: '上海教务一部',
    teamRegion: '博商上海',
    department: '上海教务部',
    employee: '孙八',
    employeeNo: 'E2003',
    amount: 39800,
    status: '已完成',
    purchaseStage: '新购',
    tradeMethod: '单独成交',
    createTime: '2024-08-10 11:00:00',
    payTime: '2024-08-10 11:10:00',
    deliveryTime: '2024-08-12 14:00:00',
    revenueConfirmTime: '2024-08-10 11:10:00',
    activityTeam: '',
    activityTeamType: '',
    activityInviter: '',
    activityInviterTeam: '',
    activityInviterTeamType: '',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '新购',
    memberBatch: '',
    deliveryCompanyName: '',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/试听课',
    deductionRatio: 0,
    deductionAmount: 0,
    actualPayAmount: 39800,
    refundAmount: 0,
    matchedRuleVersion: 'v2',
    matchedRuleId: 'rv2',
  },
  {
    id: 'ORD2024090004',
    orderNo: 'ORD2024090004',
    orderType: '活动门票',
    product: '定制咨询-组织发展',
    productType: '定制咨询',
    buyer: '周九',
    buyerNo: 'B10004',
    buyerSource: '社群运营',
    team: '杭州教务一部',
    teamRegion: '博商杭州',
    department: '杭州教务',
    employee: '吴十',
    employeeNo: 'E2004',
    amount: 1999,
    status: '已支付',
    purchaseStage: '新购',
    tradeMethod: '单独成交',
    createTime: '2024-09-05 16:00:00',
    payTime: '2024-09-05 16:05:00',
    deliveryTime: null,
    revenueConfirmTime: '2024-09-05 16:05:00',
    activityTeam: '杭州教务一部',
    activityTeamType: '活动运营',
    activityInviter: '王增长',
    activityInviterTeam: '杭州教务一部',
    activityInviterTeamType: '内部团队',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '增购',
    memberBatch: '',
    deliveryCompanyName: '',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/沙龙论坛',
    deductionRatio: 0.03,
    deductionAmount: 60,
    actualPayAmount: 1999,
    refundAmount: 0,
    matchedRuleVersion: 'v2',
    matchedRuleId: 'rv2',
  },
  {
    id: 'ORD2025010005',
    orderNo: 'ORD2025010005',
    orderType: '产品课程',
    product: '咨询-企业管理',
    productType: '咨询',
    buyer: '郑十一',
    buyerNo: 'B10005',
    buyerSource: '线上推广',
    team: '赫柏队',
    teamRegion: '博商深圳',
    department: '深圳教务',
    employee: '李四',
    employeeNo: 'E2001',
    amount: 29800,
    status: '已完成',
    purchaseStage: '新购',
    tradeMethod: '单独成交',
    createTime: '2025-01-20 10:00:00',
    payTime: '2025-01-20 10:05:00',
    deliveryTime: '2025-01-22 09:00:00',
    revenueConfirmTime: '2025-01-20 10:05:00',
    activityTeam: '',
    activityTeamType: '',
    activityInviter: '',
    activityInviterTeam: '',
    activityInviterTeamType: '',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '新购',
    memberBatch: '',
    deliveryCompanyName: '',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/公开课',
    deductionRatio: 0,
    deductionAmount: 0,
    actualPayAmount: 29800,
    refundAmount: 0,
    matchedRuleVersion: 'v3',
    matchedRuleId: 'rv3',
  },
  {
    id: 'ORD2025020006',
    orderNo: 'ORD2025020006',
    orderType: '卡项订单',
    product: '定制咨询-营销战略',
    productType: '定制咨询',
    buyer: '陈十二',
    buyerNo: 'B10006',
    buyerSource: '渠道推荐',
    team: '苏州教务一部',
    teamRegion: '博商苏州',
    department: '苏州教务',
    employee: '王五',
    employeeNo: 'E2005',
    amount: 49800,
    status: '已完成',
    purchaseStage: '增购',
    tradeMethod: '配合成交',
    createTime: '2025-02-14 09:30:00',
    payTime: '2025-02-14 10:00:00',
    deliveryTime: '2025-02-15 10:00:00',
    revenueConfirmTime: '2025-02-14 10:00:00',
    activityTeam: '苏州教务一部',
    activityTeamType: '导流合作',
    activityInviter: '李渠道',
    activityInviterTeam: '苏州教务一部',
    activityInviterTeamType: '外部合作',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '新购',
    memberBatch: '2025年第1期',
    deliveryCompanyName: '',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/试听课',
    deductionRatio: 0.08,
    deductionAmount: 3984,
    actualPayAmount: 49800,
    refundAmount: 0,
    matchedRuleVersion: 'v3',
    matchedRuleId: 'rv3',
  },
  {
    id: 'ORD2025030007',
    orderNo: 'ORD2025030007',
    orderType: '复训',
    product: '咨询-数字化转型',
    productType: '咨询',
    buyer: '林十三',
    buyerNo: 'B10007',
    buyerSource: '线上推广',
    team: '大客户经理二组',
    teamRegion: '博商深圳',
    department: '全域线下',
    employee: '赵六',
    employeeNo: 'E2002',
    amount: 12800,
    status: '待交付',
    purchaseStage: '新购',
    tradeMethod: '单独成交',
    createTime: '2025-03-08 15:00:00',
    payTime: '2025-03-08 15:05:00',
    deliveryTime: null,
    revenueConfirmTime: '2025-03-08 15:05:00',
    activityTeam: '',
    activityTeamType: '',
    activityInviter: '',
    activityInviterTeam: '',
    activityInviterTeamType: '',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '增购',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/公开课',
    deductionRatio: 0,
    deductionAmount: 0,
    actualPayAmount: 12800,
    refundAmount: 0,
    matchedRuleVersion: 'v3',
    matchedRuleId: 'rv3',
  },
  {
    id: 'ORD2025040008',
    orderNo: 'ORD2025040008',
    orderType: '活动门票',
    product: '咨询-人才发展',
    productType: '咨询',
    buyer: '黄十四',
    buyerNo: 'B10008',
    buyerSource: '社群运营',
    team: '杭州教务二部',
    teamRegion: '博商杭州',
    department: '杭州教务',
    employee: '孙八',
    employeeNo: 'E2003',
    amount: 2999,
    status: '已取消',
    purchaseStage: '新购',
    tradeMethod: '配合成交',
    createTime: '2025-04-01 11:00:00',
    payTime: null,
    deliveryTime: null,
    revenueConfirmTime: null,
    activityTeam: '',
    activityTeamType: '',
    activityInviter: '',
    activityInviterTeam: '',
    activityInviterTeamType: '',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '新购',
    memberBatch: '',
    deliveryCompanyName: '',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/沙龙论坛',
    deductionRatio: 0,
    deductionAmount: 0,
    actualPayAmount: 0,
    refundAmount: 0,
    matchedRuleVersion: 'v3',
    matchedRuleId: 'rv3',
  },
  {
    id: 'ORD2025050009',
    orderNo: 'ORD2025050009',
    orderType: '产品课程',
    product: '咨询-组织变革',
    productType: '咨询',
    buyer: '吴十',
    buyerNo: 'B10009',
    buyerSource: '老客户转介',
    team: '苏州教务一部',
    teamRegion: '博商苏州',
    department: '苏州教务',
    employee: '周九',
    employeeNo: 'E2009',
    amount: 39800,
    status: '已支付',
    purchaseStage: '新购',
    tradeMethod: '单独成交',
    createTime: '2025-05-10 09:00:00',
    payTime: '2025-05-10 09:05:00',
    deliveryTime: null,
    revenueConfirmTime: null,
    activityTeam: '',
    activityTeamType: '',
    activityInviter: '',
    activityInviterTeam: '',
    activityInviterTeamType: '',
    productAttribution: '深圳市博商管理科学研究院股份有限公司',
    bsPurchaseStage: '新购',
    memberBatch: '',
    deliveryCompanyName: '',
    activityOrganizer: '博商管理',
    activityType: '线下体验课/公开课',
    deductionRatio: 0,
    deductionAmount: 0,
    actualPayAmount: 39800,
    refundAmount: 0,
    matchedRuleVersion: null,
    matchedRuleId: null,
  },
];

export { defaultOrders as orders };

// ========== 支付记录 ==========
export const payments = [
  // ORD2024010001
  { id: 'PAY001', orderNo: 'ORD2024010001', time: '2026-03-15 10:22:45', employee: '辛婷 (B03965)', payType: '消费', payAccount: '郭恩琴(GRC2023082662642)', payChannel: '余额支付', amount: 29800, afterSaleNo: '--', flowType: '绑定', relatedFlow: 'C0547E4002NDCOZ、C0547BL0027H0LZ' },
  { id: 'PAY001R', orderNo: 'ORD2024010001', time: '2026-03-20 11:37:35', employee: '辛婷 (B03965)', payType: '退费', payAccount: '郭恩琴(C2023082662642)', payChannel: '退至预付款', amount: -29800, afterSaleNo: 'SH2603200956442642-01', flowType: '解绑', relatedFlow: 'C0547E4002NDCOZ、C0547BL0027H0LZ' },
  // ORD2024020002
  { id: 'PAY002', orderNo: 'ORD2024020002', time: '2026-04-10 09:15:20', employee: '张伟 (B02891)', payType: '消费', payAccount: '李明辉(GRC2021041856321)', payChannel: '对公转账', amount: 15800, afterSaleNo: '--', flowType: '绑定', relatedFlow: 'C0548A1003PQEMN、C0548A2004QRST' },
  // ORD2024080003
  { id: 'PAY003', orderNo: 'ORD2024080003', time: '2026-05-02 14:30:10', employee: '李敏 (B04123)', payType: '消费', payAccount: '王晓燕(GRC2022110923847)', payChannel: '余额支付', amount: 39800, afterSaleNo: '--', flowType: '绑定', relatedFlow: 'C0549B2005UVWXY、C0549B3006ZABC' },
  { id: 'PAY003R', orderNo: 'ORD2024080003', time: '2026-05-10 16:45:22', employee: '李敏 (B04123)', payType: '退费', payAccount: '王晓燕(C2022110923847)', payChannel: '退至预付款', amount: -39800, afterSaleNo: 'SH26051009238847-02', flowType: '退费流水', relatedFlow: 'C0549B2005UVWXY、C0549B3006ZABC' },
  // ORD2024090004
  { id: 'PAY004', orderNo: 'ORD2024090004', time: '2026-06-08 11:05:30', employee: '王芳 (B03756)', payType: '消费', payAccount: '张丽华(GRC2019031567890)', payChannel: '微信支付', amount: 1999, afterSaleNo: '--', flowType: '绑定', relatedFlow: 'C0550C3007DEFGH' },
  // ORD2025010005
  { id: 'PAY005', orderNo: 'ORD2025010005', time: '2026-07-15 08:40:55', employee: '陈强 (B02988)', payType: '消费', payAccount: '刘文彬(GRC2023061287654)', payChannel: '余额支付', amount: 29800, afterSaleNo: '--', flowType: '绑定', relatedFlow: 'C0551D4008IJKLM、C0551D5009NOPQ' },
  // ORD2025020006
  { id: 'PAY006', orderNo: 'ORD2025020006', time: '2026-08-20 13:20:18', employee: '刘洋 (B04567)', payType: '消费', payAccount: '陈美玲(GRC2024010534218)', payChannel: '对公转账', amount: 49800, afterSaleNo: '--', flowType: '绑定', relatedFlow: 'C0552E5010RSTUV、C0552E6011WXYZA' },
  { id: 'PAY006R', orderNo: 'ORD2025020006', time: '2026-08-28 15:10:42', employee: '刘洋 (B04567)', payType: '退费', payAccount: '陈美玲(C2024010534218)', payChannel: '退至预付款', amount: -49800, afterSaleNo: 'SH2608280534218-03', flowType: '解绑', relatedFlow: 'C0552E5010RSTUV、C0552E6011WXYZA' },
  // ORD2025030007
  { id: 'PAY007', orderNo: 'ORD2025030007', time: '2026-09-05 10:00:05', employee: '赵静 (B03214)', payType: '消费', payAccount: '赵国强(GRC2022081976543)', payChannel: '支付宝', amount: 12800, afterSaleNo: '--', flowType: '绑定', relatedFlow: 'C0553F6012BCDEF' },
];

// ========== 交付记录 ==========
export const deliveries = [
  { id: 'DLV001', orderNo: 'ORD2024010001', deliveryTime: '2024-03-16 10:00:00', deliverer: '交付服务组', status: '已交付', content: 'AI实战班课程开通' },
  { id: 'DLV002', orderNo: 'ORD2024020002', deliveryTime: '2024-05-22 09:00:00', deliverer: '交付服务组', status: '已交付', content: '产品经理班课程开通' },
  { id: 'DLV003', orderNo: 'ORD2024080003', deliveryTime: '2024-08-12 14:00:00', deliverer: '交付服务组', status: '已交付', content: '领导力班课程开通' },
  { id: 'DLV004', orderNo: 'ORD2025010005', deliveryTime: '2025-01-22 09:00:00', deliverer: '交付服务组', status: '已交付', content: 'AI实战班课程开通' },
  { id: 'DLV005', orderNo: 'ORD2025020006', deliveryTime: '2025-02-15 10:00:00', deliverer: '交付服务组', status: '已交付', content: '企业版会员开通' },
];

// ========== 规则快照记录（订单维度） ==========
export const ruleSnapshots = [
  {
    id: 'RS001',
    orderNo: 'ORD2024010001',
    snapshots: [
      { version: 'v1', snapshotTime: '2024-03-15 09:35:00', ruleName: '特训营收入分配规则 v1', reason: '订单创建，自动匹配规则', operator: '系统', rules: ruleVersions[0].rules },
      { version: 'v2', snapshotTime: '2024-07-02 00:00:00', ruleName: '特训营收入分配规则 v2', reason: '规则版本升级，影响未来收入', operator: 'B00002', rules: ruleVersions[1].rules },
    ],
  },
  {
    id: 'RS002',
    orderNo: 'ORD2024020002',
    snapshots: [
      { version: 'v1', snapshotTime: '2024-05-20 14:30:00', ruleName: '特训营收入分配规则 v1', reason: '订单创建，自动匹配规则', operator: '系统', rules: ruleVersions[0].rules },
      { version: 'v2', snapshotTime: '2024-07-02 00:00:00', ruleName: '特训营收入分配规则 v2', reason: '规则版本升级，影响未来收入', operator: 'B00002', rules: ruleVersions[1].rules },
    ],
  },
  {
    id: 'RS003',
    orderNo: 'ORD2024080003',
    snapshots: [
      { version: 'v2', snapshotTime: '2024-08-10 11:10:00', ruleName: '特训营收入分配规则 v2', reason: '订单创建，自动匹配规则', operator: '系统', rules: ruleVersions[1].rules },
    ],
  },
  {
    id: 'RS004',
    orderNo: 'ORD2024090004',
    snapshots: [
      { version: 'v2', snapshotTime: '2024-09-05 16:05:00', ruleName: '特训营收入分配规则 v2', reason: '订单创建，自动匹配规则', operator: '系统', rules: ruleVersions[1].rules },
    ],
  },
  {
    id: 'RS005',
    orderNo: 'ORD2025010005',
    snapshots: [
      { version: 'v3', snapshotTime: '2025-01-20 10:05:00', ruleName: '特训营收入分配规则 v3', reason: '订单创建，自动匹配规则', operator: '系统', rules: ruleVersions[2].rules },
    ],
  },
  {
    id: 'RS006',
    orderNo: 'ORD2025020006',
    snapshots: [
      { version: 'v3', snapshotTime: '2025-02-14 10:00:00', ruleName: '特训营收入分配规则 v3', reason: '订单创建，自动匹配规则', operator: '系统', rules: ruleVersions[2].rules },
    ],
  },
  {
    id: 'RS007',
    orderNo: 'ORD2025030007',
    snapshots: [
      { version: 'v3', snapshotTime: '2025-03-08 15:05:00', ruleName: '特训营收入分配规则 v3', reason: '订单创建，自动匹配规则', operator: '系统', rules: ruleVersions[2].rules },
    ],
  },
];

// ========== 收入流水计算 ==========
export function calculateRevenues(order) {
  const ruleVersion = ruleVersions.find((rv) => rv.version === order.matchedRuleVersion);
  if (!ruleVersion) return [];

  const revenues = [];
  const amount = order.amount;

  // 支付触发：业务收入1 + 业务收入2 + 导流收入 + 业务渠道分成
  if (order.payTime) {
    revenues.push({
      id: `REV-${order.orderNo}-BIZ1`,
      type: '业务收入1',
      trigger: '支付',
      amount: +(amount * ruleVersion.rules.business1Ratio).toFixed(2),
      ratio: ruleVersion.rules.business1Ratio,
      team: resolveRevenueTeam(order, 'business1', ruleVersion.rules.business1Team),
      confirmTime: order.payTime,
      ruleVersion: order.matchedRuleVersion,
      status: '已确认',
    });
    revenues.push({
      id: `REV-${order.orderNo}-BIZ2`,
      type: '业务收入2',
      trigger: '支付',
      amount: +(amount * ruleVersion.rules.business2Ratio).toFixed(2),
      ratio: ruleVersion.rules.business2Ratio,
      team: resolveRevenueTeam(order, 'business2', ruleVersion.rules.business2Team),
      confirmTime: order.payTime,
      ruleVersion: order.matchedRuleVersion,
      status: '已确认',
    });
    revenues.push({
      id: `REV-${order.orderNo}-TRAFFIC`,
      type: '导流收入',
      trigger: '支付',
      amount: +(amount * ruleVersion.rules.trafficRatio).toFixed(2),
      ratio: ruleVersion.rules.trafficRatio,
      team: resolveRevenueTeam(order, 'traffic', ruleVersion.rules.trafficTeam),
      confirmTime: order.payTime,
      ruleVersion: order.matchedRuleVersion,
      status: '已确认',
    });
    revenues.push({
      id: `REV-${order.orderNo}-CHANNEL`,
      type: '业务渠道分成',
      trigger: '支付',
      amount: +(amount * ruleVersion.rules.channelRatio).toFixed(2),
      ratio: ruleVersion.rules.channelRatio,
      team: resolveRevenueTeam(order, 'channel', ruleVersion.rules.channelTeam),
      confirmTime: order.payTime,
      ruleVersion: order.matchedRuleVersion,
      status: '已确认',
    });
  }

  // 交付触发：交付收入
  if (order.deliveryTime) {
    revenues.push({
      id: `REV-${order.orderNo}-DELIVERY`,
      type: '交付收入',
      trigger: '交付',
      amount: +(amount * ruleVersion.rules.deliveryRatio).toFixed(2),
      ratio: ruleVersion.rules.deliveryRatio,
      team: resolveRevenueTeam(order, 'delivery', ruleVersion.rules.deliveryTeam),
      confirmTime: order.deliveryTime,
      ruleVersion: order.matchedRuleVersion,
      status: '已确认',
    });
  }

  return revenues;
}

// ========== 调整记录 ==========
export const adjustments = [];

// ========== 调整单数据 ==========
const STORAGE_KEY_ADJUSTMENT_ORDERS = 'accounting_adjustment_orders';

const adjustmentItems = ['业务收入', '业务渠道分成', '交付收入', '导流收入', '成本项调整'];
const applicants = ['15976769220', 'B00000', 'B09711', 'E2001', 'E2002', 'E2003', 'E2004', 'E2005'];
const orderNos = [
  'BS2601201109208019', 'ACTS20251229301813', 'BS2601181009235023', 'ACTS20260105301814',
  'BS2601151435206101', 'ACTS20260110301815', 'BS2601190915204027', 'ACTS20260115301816',
  'BS2601221005203028', 'ACTS20260120301817', 'BS2601250830201029', 'ACTS20260125301818',
  'BS2601281435209030', 'ACTS20260128301819', 'BS2602011005212031', 'ACTS20260201301820',
  'BS2602040915215032', 'ACTS20260204301821', 'BS2602071435217033', 'ACTS20260207301822',
];

function generateAdjustmentOrders() {
  const orders = [];
  const baseDate = dayjs('2026-01-20');
  for (let i = 0; i < 68; i++) {
    const date = baseDate.add(i * 4, 'hour');
    const applyDate = date.add(Math.floor(i * 17) % 60, 'minute');
    const approveDelay = 3 + (i % 8);
    const approveDate = applyDate.add(approveDelay, 'minute');
    orders.push({
      id: `TZO${String(i + 1).padStart(3, '0')}`,
      adjustmentNo: `TZD${date.format('YYYYMMDD')}${String(i + 1).padStart(4, '0')}`,
      adjustmentItem: adjustmentItems[i % adjustmentItems.length],
      status: i < 60 ? '审批通过' : (i < 64 ? '待审批' : '已驳回'),
      relatedBusinessNo: orderNos[i % orderNos.length],
      applicant: applicants[i % applicants.length],
      applicationTime: applyDate.format('YYYY-MM-DD HH:mm:ss'),
      approvalTime: i < 60 ? approveDate.format('YYYY-MM-DD HH:mm:ss') : null,
      approvalNo: i < 60 ? `${approveDate.format('YYYYMMDDHHmmss')}${String(100 + i).slice(-3)}` : null,
    });
  }
  return orders;
}

const defaultAdjustmentOrders = generateAdjustmentOrders();

export function getStoredAdjustmentOrders() {
  localStorage.setItem(STORAGE_KEY_ADJUSTMENT_ORDERS, JSON.stringify(defaultAdjustmentOrders));
  return JSON.parse(localStorage.getItem(STORAGE_KEY_ADJUSTMENT_ORDERS));
}

export function saveAdjustmentOrders(orders) {
  localStorage.setItem(STORAGE_KEY_ADJUSTMENT_ORDERS, JSON.stringify(orders));
}

export function addAdjustment(adjustment) {
  const stored = getStoredAdjustments();
  const newAdj = {
    ...adjustment,
    id: `ADJ${String(stored.length + 1).padStart(3, '0')}`,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  stored.push(newAdj);
  saveAdjustments(stored);
  return newAdj;
}

export function calculateRevenueBreakdown(order, orderAdjustments = []) {
  const ruleVersion = ruleVersions.find((rv) => rv.version === order.matchedRuleVersion);
  if (!ruleVersion) return { totalPending: 0, totalConfirmed: 0, totalToConfirm: 0, items: [] };

  const rules = ruleVersion.rules;
  const amount = order.amount;
  const isPaid = !!order.payTime;
  const isDelivered = !!order.deliveryTime;
  const isCancelled = order.status === '已取消';

  const types = [
    { key: 'business1', name: '业务收入1', ratio: rules.business1Ratio, trigger: '支付', team: resolveRevenueTeam(order, 'business1', rules.business1Team) },
    { key: 'business2', name: '业务收入2', ratio: rules.business2Ratio, trigger: '支付', team: resolveRevenueTeam(order, 'business2', rules.business2Team) },
    { key: 'traffic', name: '导流收入', ratio: rules.trafficRatio, trigger: '支付', team: resolveRevenueTeam(order, 'traffic', rules.trafficTeam) },
    { key: 'channel', name: '业务渠道分成', ratio: rules.channelRatio, trigger: '支付', team: resolveRevenueTeam(order, 'channel', rules.channelTeam) },
    { key: 'delivery', name: '交付收入', ratio: rules.deliveryRatio, trigger: '交付', team: resolveRevenueTeam(order, 'delivery', rules.deliveryTeam) },
  ];

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

    return { key: t.key, name: t.name, ratio: t.ratio, team: t.team, toConfirm: full, pending, confirmed };
  });

  orderAdjustments.forEach((adj) => {
    if (adj.type === '收入调整') {
      const item = items.find((i) => i.name === adj.details?.revenueType);
      if (item) {
        const adjAmount = adj.details?.adjustAmount || 0;
        if (adj.details?.adjustCategory === 'increase') {
          item.confirmed += adjAmount;
          item.toConfirm += adjAmount;
        } else {
          item.confirmed = Math.max(0, item.confirmed - adjAmount);
          item.toConfirm = Math.max(0, item.toConfirm - adjAmount);
        }
      }
    }
  });

  const totalConfirmed = items.reduce((s, i) => s + i.confirmed, 0);
  const totalPending = items.reduce((s, i) => s + i.pending, 0);

  return {
    totalToConfirm: items.reduce((s, i) => s + i.toConfirm, 0),
    totalPending,
    totalConfirmed,
    items,
  };
}

// ========== 收入流水明细 ==========
export function calculateRevenueFlows(order, orderAdjustments = []) {
  const flows = [];

  if (order.payTime) {
    const ruleVersion = ruleVersions.find((rv) => rv.version === order.matchedRuleVersion);
    if (ruleVersion) {
      const rules = ruleVersion.rules;
      const amount = order.amount;
      [
        { type: '业务收入1', ratio: rules.business1Ratio, team: resolveRevenueTeam(order, 'business1', rules.business1Team) },
        { type: '业务收入2', ratio: rules.business2Ratio, team: resolveRevenueTeam(order, 'business2', rules.business2Team) },
        { type: '导流收入', ratio: rules.trafficRatio, team: resolveRevenueTeam(order, 'traffic', rules.trafficTeam) },
        { type: '业务渠道分成', ratio: rules.channelRatio, team: resolveRevenueTeam(order, 'channel', rules.channelTeam) },
      ].forEach((item, idx) => {
        flows.push({
          id: `FLOW-${order.orderNo}-PAY-${idx}`,
          time: order.payTime,
          operationType: '增加',
          operationSubType: '订单支付',
          revenueType: item.type,
          detailNo: `PAY-${order.orderNo}-${idx + 1}`,
          changeAmount: amount,
          confirmBase: amount,
          confirmRatio: item.ratio,
          confirmedAmount: +(amount * item.ratio).toFixed(2),
          team: item.team,
          ruleVersion: order.matchedRuleVersion,
          deliveryNo: '',
          afterSaleNo: '',
          status: '已确认',
          offsetStatus: '--',
          remark: '',
          deliveryRemark: '',
        });
      });
    }
  }

  if (order.deliveryTime) {
    const ruleVersion = ruleVersions.find((rv) => rv.version === order.matchedRuleVersion);
    if (ruleVersion) {
      const rules = ruleVersion.rules;
      const dlvRecord = deliveries.find((d) => d.orderNo === order.orderNo);
      flows.push({
        id: `FLOW-${order.orderNo}-DLV`,
        time: order.deliveryTime,
        operationType: '增加',
        operationSubType: '订单交付',
        revenueType: '交付收入',
        detailNo: `DLV-${order.orderNo}-1`,
        changeAmount: order.amount,
        confirmBase: order.amount,
        confirmRatio: rules.deliveryRatio,
        confirmedAmount: +(order.amount * rules.deliveryRatio).toFixed(2),
        team: resolveRevenueTeam(order, 'delivery', rules.deliveryTeam),
        ruleVersion: order.matchedRuleVersion,
        deliveryNo: dlvRecord?.id || '',
        afterSaleNo: '',
        status: '已确认',
        offsetStatus: '--',
        remark: '',
        deliveryRemark: '',
      });
    }
  }

  if (order.refundAmount > 0 && order.payTime) {
    const ruleVersion = ruleVersions.find((rv) => rv.version === order.matchedRuleVersion);
    if (ruleVersion) {
      const rules = ruleVersion.rules;
      const refundBase = order.refundAmount;
      [
        { type: '业务收入1', ratio: rules.business1Ratio, team: resolveRevenueTeam(order, 'business1', rules.business1Team) },
        { type: '业务收入2', ratio: rules.business2Ratio, team: resolveRevenueTeam(order, 'business2', rules.business2Team) },
        { type: '导流收入', ratio: rules.trafficRatio, team: resolveRevenueTeam(order, 'traffic', rules.trafficTeam) },
        { type: '业务渠道分成', ratio: rules.channelRatio, team: resolveRevenueTeam(order, 'channel', rules.channelTeam) },
      ].forEach((item, idx) => {
        flows.push({
          id: `FLOW-${order.orderNo}-REFUND-${idx}`,
          time: order.payTime,
          operationType: '扣减',
          operationSubType: '订单退费',
          revenueType: item.type,
          detailNo: `RFN-${order.orderNo}-${idx + 1}`,
          changeAmount: refundBase,
          confirmBase: refundBase,
          confirmRatio: item.ratio,
          confirmedAmount: -(+(refundBase * item.ratio).toFixed(2)),
          team: item.team,
          ruleVersion: order.matchedRuleVersion,
          deliveryNo: '',
          afterSaleNo: `AS-${order.orderNo}`,
          status: '异常',
          offsetStatus: '冲抵',
          remark: '',
          deliveryRemark: '',
        });
      });
    }
  }

  if (order.deductionAmount > 0 && order.payTime) {
    const ruleVersion = ruleVersions.find((rv) => rv.version === order.matchedRuleVersion);
    if (ruleVersion) {
      const rules = ruleVersion.rules;
      [
        { type: '业务收入1', ratio: rules.business1Ratio, team: resolveRevenueTeam(order, 'business1', rules.business1Team) },
        { type: '业务收入2', ratio: rules.business2Ratio, team: resolveRevenueTeam(order, 'business2', rules.business2Team) },
        { type: '导流收入', ratio: rules.trafficRatio, team: resolveRevenueTeam(order, 'traffic', rules.trafficTeam) },
        { type: '业务渠道分成', ratio: rules.channelRatio, team: resolveRevenueTeam(order, 'channel', rules.channelTeam) },
      ].forEach((item, idx) => {
        flows.push({
          id: `FLOW-${order.orderNo}-DEDUCT-${idx}`,
          time: order.payTime,
          operationType: '扣减',
          operationSubType: '减人退费',
          revenueType: item.type,
          detailNo: `DED-${order.orderNo}-${idx + 1}`,
          changeAmount: order.deductionAmount,
          confirmBase: order.deductionAmount,
          confirmRatio: item.ratio,
          confirmedAmount: -(+(order.deductionAmount * item.ratio).toFixed(2)),
          team: item.team,
          ruleVersion: order.matchedRuleVersion,
          deliveryNo: '',
          afterSaleNo: '',
          status: '异常',
          offsetStatus: '已被冲抵',
          remark: '',
          deliveryRemark: '',
        });
      });
    }
  }

  orderAdjustments.forEach((adj) => {
    const isRevenueAdj = adj.type === '收入调整';
    const isIncrease = adj.details?.adjustCategory === 'increase';
    const adjAmount = adj.details?.adjustAmount || 0;
    flows.push({
      id: `FLOW-ADJ-${adj.id}`,
      time: adj.createdAt,
      operationType: isRevenueAdj ? (isIncrease ? '增加' : '扣减') : '增加',
      operationSubType: isRevenueAdj ? (isIncrease ? '调账-增加' : '调账-冲抵') : '调账-增加',
      revenueType: adj.details?.revenueType || '-',
      detailNo: `ADJ-${adj.id}`,
      changeAmount: adjAmount,
      confirmBase: adjAmount,
      confirmRatio: null,
      confirmedAmount: isRevenueAdj ? (isIncrease ? adjAmount : -adjAmount) : 0,
      team: '-',
      ruleVersion: adj.details?.targetVersion || order.matchedRuleVersion,
      deliveryNo: '',
      afterSaleNo: '',
      status: '已生效',
      offsetStatus: isRevenueAdj && !isIncrease ? '已被冲抵' : '--',
      remark: adj.reason || '',
      deliveryRemark: '',
    });
  });

  flows.sort((a, b) => a.time.localeCompare(b.time));
  return flows;
}

// ========== 批量调整订单规则 ==========
export function batchUpdateOrderRules(orderNos, newRuleVersion) {
  const successList = [];
  const failedList = [];

  // 1. 找到目标规则
  const newRule = ruleVersions.find((rv) => rv.version === newRuleVersion);
  if (!newRule) {
    // 规则不存在，所有订单标记失败
    orderNos.forEach((orderNo) => {
      failedList.push({
        orderNo,
        oldVersion: '',
        newVersion: newRuleVersion,
        reason: `目标规则版本 ${newRuleVersion} 不存在`,
      });
    });
    return { success: successList, failed: failedList };
  }

  // 2. 获取订单数据
  const orders = getStoredOrders();

  // 3. 比例 key 映射
  const ratioKeys = [
    { key: 'business1Ratio', name: '业务收入1' },
    { key: 'business2Ratio', name: '业务收入2' },
    { key: 'trafficRatio', name: '导流收入' },
    { key: 'channelRatio', name: '业务渠道分成' },
    { key: 'deliveryRatio', name: '交付收入' },
  ];

  // 4. 逐个处理订单
  orderNos.forEach((orderNo) => {
    // a. 找到订单
    const orderIndex = orders.findIndex((o) => o.orderNo === orderNo);
    if (orderIndex === -1) {
      failedList.push({
        orderNo,
        oldVersion: '',
        newVersion: newRuleVersion,
        reason: `订单 ${orderNo} 不存在`,
      });
      return;
    }

    const order = orders[orderIndex];

    // b. 找到旧规则
    const oldRule = ruleVersions.find((rv) => rv.version === order.matchedRuleVersion);
    if (!oldRule) {
      failedList.push({
        orderNo,
        oldVersion: order.matchedRuleVersion || '',
        newVersion: newRuleVersion,
        reason: `订单当前规则版本 ${order.matchedRuleVersion} 不存在`,
      });
      return;
    }

    // c. 计算 breakdown
    const breakdown = calculateRevenueBreakdown(order);

    // d. 检查是否所有 item.confirmed === 0（无有效已确认收入，免校验直接通过）
    const hasAnyConfirmed = breakdown.items.some((item) => item.confirmed !== 0);

    let mismatchReasons = [];

    if (hasAnyConfirmed) {
      // e. 遍历 5 个比例 key 进行检查
      ratioKeys.forEach((ratioKey) => {
        // 通过 item.key 匹配：ratioKey.key 去掉 'Ratio' 后缀即为 item.key
        const itemKey = ratioKey.key.replace(/Ratio$/, '');
        const item = breakdown.items.find((i) => i.key === itemKey);

        if (item && item.confirmed !== 0) {
          const oldRatio = oldRule.rules[ratioKey.key];
          const newRatio = newRule.rules[ratioKey.key];

          // f. 比较旧规则和新规则的比例
          if (oldRatio !== newRatio) {
            // g. 记录不一致原因
            mismatchReasons.push(
              `${ratioKey.name}比例不一致: 当前${(oldRatio * 100).toFixed(0)}%, 目标${(newRatio * 100).toFixed(0)}%`
            );
          }
        }
      });
    }

    // h. 如果有不一致，加入失败列表
    if (mismatchReasons.length > 0) {
      failedList.push({
        orderNo,
        oldVersion: order.matchedRuleVersion,
        newVersion: newRuleVersion,
        reason: mismatchReasons.join('; '),
      });
    } else {
      // i. 没有不一致，修改订单的 matchedRuleVersion 和 matchedRuleId
      orders[orderIndex] = {
        ...orders[orderIndex],
        matchedRuleVersion: newRuleVersion,
        matchedRuleId: newRule.id,
      };
      successList.push(orderNo);
    }
  });

  // 5. 持久化
  saveOrders(orders);

  // 6. 返回结果
  return { success: successList, failed: failedList };
}
