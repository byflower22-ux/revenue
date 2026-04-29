import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Form, Input, Select, Button, Table, Space, Upload, Tag, message, InputNumber, Switch, Popover,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, UploadOutlined, UndoOutlined, DeleteOutlined,
  EditOutlined, CheckCircleOutlined, CloseOutlined,
} from '@ant-design/icons';
import { getStoredOrders, getStoredAdjustmentOrders, saveAdjustmentOrders, calculateRevenueFlows, ruleVersions } from './mockData';
import dayjs from 'dayjs';
import IterationMark from './demo/IterationMark';
import FieldMark from './demo/FieldMark';

const revenueTypeMap = [
  { key: 'business1', name: '业务收入1', ratioKey: 'business1Ratio', teamKey: 'business1Team', baseType: '业务收入' },
  { key: 'business2', name: '业务收入2', ratioKey: 'business2Ratio', teamKey: 'business2Team', baseType: '业务收入' },
  { key: 'traffic', name: '导流收入', ratioKey: 'trafficRatio', teamKey: 'trafficTeam', baseType: '导流收入' },
  { key: 'channel', name: '业务渠道分成', ratioKey: 'channelRatio', teamKey: 'channelTeam', baseType: '业务渠道分成' },
  { key: 'delivery', name: '交付收入', ratioKey: 'deliveryRatio', teamKey: 'deliveryTeam', baseType: '交付收入' },
];

const baseTypeOptions = [
  { value: '业务收入', label: '业务收入' },
  { value: '导流收入', label: '导流收入' },
  { value: '业务渠道分成', label: '业务渠道分成' },
  { value: '交付收入', label: '交付收入' },
];

const revenueColorMap = {
  '业务收入': '#1890ff',
  '导流收入': '#52c41a',
  '业务渠道分成': '#fa8c16',
  '交付收入': '#722ed1',
};

const { TextArea } = Input;

const adjustmentItemOptions = [
  { value: '业务收入', label: '业务收入' },
  { value: '导流收入', label: '导流收入' },
  { value: '业务渠道分成', label: '业务渠道分成' },
  { value: '交付收入', label: '交付收入' },
];

const operationTypeOptions = [
  { value: '增加', label: '增加' },
  { value: '扣减', label: '扣减' },
];

const operationSubTypeOptions = [
  { value: '订单支付', label: '订单支付' },
  { value: '调账-新增', label: '调账-新增' },
  { value: '调账-冲抵', label: '调账-冲抵' },
];

const teamOptions = [
  { value: '特训营业务组', label: '特训营业务组' },
  { value: '导流运营组', label: '导流运营组' },
  { value: '交付服务组', label: '交付服务组' },
  { value: '渠道合作组', label: '渠道合作组' },
  { value: '博商管理', label: '博商管理' },
];

const periodOptions = [
  { value: '当期', label: '当期' },
  { value: '次期', label: '次期' },
];

const reasonOptions = [
  { value: '数据录入错误', label: '数据录入错误' },
  { value: '规则变更调整', label: '规则变更调整' },
  { value: '客户退费', label: '客户退费' },
  { value: '团队归属变更', label: '团队归属变更' },
  { value: '其他', label: '其他' },
];

const approverOptions = [
  { value: '超级管理员', label: '超级管理员' },
  { value: '财务主管', label: '财务主管' },
];

export default function AdjustmentFormPage({ onBack }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const [adjustItems, setAdjustItems] = useState([]);
  const [deliveryAdjustItems, setDeliveryAdjustItems] = useState([]);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [existingItems, setExistingItems] = useState([]);
  const [editingKeys, setEditingKeys] = useState(new Set());
  const [adjustRule, setAdjustRule] = useState(false);
  const [editedRuleItems, setEditedRuleItems] = useState(null);
  const [showAddRuleTypePicker, setShowAddRuleTypePicker] = useState(false);
  const [addRuleType, setAddRuleType] = useState('业务收入');

  const selectedAdjustItems = Form.useWatch('adjustmentItems', form) || [];

  const showBizModule = selectedAdjustItems.some(item =>
    ['业务收入', '导流收入', '业务渠道分成'].includes(item)
  );
  const showDeliveryModule = selectedAdjustItems.includes('交付收入');

  const orders = getStoredOrders();
  const activeOrder = selectedOrders[activeOrderIndex] || null;

  useEffect(() => {
    if (activeOrder) {
      const flows = calculateRevenueFlows(activeOrder);
      const items = flows
        .filter((f) => f.operationSubType === '订单支付')
        .map((f, idx) => ({
          key: `existing-${idx}`,
          isExisting: true,
          project: f.revenueType,
          detailNo: f.detailNo,
          opType: f.operationType,
          opSubType: f.operationSubType,
          changeAmount: String(f.changeAmount),
          confirmBase: String(f.confirmBase),
          ratio: String(Math.round(f.confirmRatio * 100)),
          confirmAmount: String(Math.abs(f.confirmedAmount)),
          team: f.team,
          period: '当期',
          status: '已确认',
        }));
      setExistingItems(items);
    } else {
      setExistingItems([]);
    }
    setEditingKeys(new Set());
    setAdjustRule(false);
    setEditedRuleItems(null);
  }, [activeOrder]);

  const handleToggleOrderSelect = useCallback((orderNo) => {
    setSelectedOrders((prev) => {
      const idx = prev.findIndex((o) => o.orderNo === orderNo);
      if (idx >= 0) {
        const next = prev.filter((o) => o.orderNo !== orderNo);
        setActiveOrderIndex((prevIdx) => {
          if (next.length === 0) return 0;
          const cur = prev[prevIdx];
          if (cur && cur.orderNo === orderNo) {
            return Math.min(idx, next.length - 1);
          }
          const newIdx = next.findIndex((o) => o.orderNo === cur?.orderNo);
          return newIdx >= 0 ? newIdx : 0;
        });
        return next;
      }
      const order = orders.find((o) => o.orderNo === orderNo);
      if (order) {
        setActiveOrderIndex(prev.length);
        return [...prev, order];
      }
      return prev;
    });
  }, [orders]);

  const handleSwitchOrder = useCallback((index) => {
    setActiveOrderIndex(index);
  }, []);

  const handleRemoveOrder = useCallback((index) => {
    setSelectedOrders((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setActiveOrderIndex((prevIdx) => {
        if (next.length === 0) return 0;
        if (prevIdx >= next.length) return next.length - 1;
        if (prevIdx === index) return Math.min(index, next.length - 1);
        return prevIdx > index ? prevIdx - 1 : prevIdx;
      });
      return next;
    });
  }, []);

  const handleClearAllOrders = useCallback(() => {
    setSelectedOrders([]);
    setActiveOrderIndex(0);
  }, []);

  const matchedRule = useMemo(() => {
    if (!activeOrder) return null;
    return ruleVersions.find((rv) => rv.id === activeOrder.matchedRuleId) || null;
  }, [activeOrder]);

  const originalRuleItems = useMemo(() => {
    if (!matchedRule) return [];
    return revenueTypeMap.map((rt) => ({
      key: rt.key,
      name: rt.name,
      ratio: matchedRule.rules[rt.ratioKey],
      team: matchedRule.rules[rt.teamKey],
      baseType: rt.baseType,
    }));
  }, [matchedRule]);

  const ruleItemSource = editedRuleItems || originalRuleItems;

  const bizProjectOptions = useMemo(() => {
    return ruleItemSource
      .filter(item =>
        ['业务收入', '导流收入', '业务渠道分成'].includes(item.baseType)
        && selectedAdjustItems.includes(item.baseType)
      )
      .map(item => ({ value: item.name, label: item.name }));
  }, [ruleItemSource, selectedAdjustItems]);

  const deliveryProjectOptions = useMemo(() => {
    return ruleItemSource
      .filter(item => item.baseType === '交付收入')
      .map(item => ({ value: item.name, label: item.name }));
  }, [ruleItemSource]);

  const buildEditedItems = useCallback((rule) => {
    return revenueTypeMap.map((rt) => ({
      key: rt.key,
      name: rt.name,
      ratio: rule.rules[rt.ratioKey],
      team: rule.rules[rt.teamKey],
      baseType: rt.baseType,
      originalRatio: rule.rules[rt.ratioKey],
      originalTeam: rule.rules[rt.teamKey],
      isNew: false,
    }));
  }, []);

  const handleAdjustRuleChange = useCallback((checked) => {
    setAdjustRule(checked);
    if (checked && matchedRule) {
      setEditedRuleItems(buildEditedItems(matchedRule));
    } else {
      setEditedRuleItems(null);
      setShowAddRuleTypePicker(false);
    }
  }, [matchedRule, buildEditedItems]);

  const handleEditedRuleItemChange = useCallback((itemKey, field, value) => {
    setEditedRuleItems((prev) => prev ? prev.map((item) =>
      item.key === itemKey ? { ...item, [field]: value } : item
    ) : null);
  }, []);

  const handleRuleRatioChange = useCallback((itemKey, value) => {
    const nextValue = value == null ? 0 : Math.max(0, Math.min(Number(value), 100));
    handleEditedRuleItemChange(itemKey, 'ratio', nextValue / 100);
  }, [handleEditedRuleItemChange]);

  const handleRuleBaseTypeChange = useCallback((itemKey, baseType) => {
    setEditedRuleItems((prev) => {
      if (!prev) return null;
      const sameTypeCount = prev.filter((item) => item.key !== itemKey && item.baseType === baseType).length;
      return prev.map((item) => {
        if (item.key !== itemKey) return item;
        return {
          ...item,
          baseType,
          name: `${baseType}${sameTypeCount + 1}`,
        };
      });
    });
  }, []);

  const handleAddRuleItem = useCallback(() => {
    setShowAddRuleTypePicker((prev) => !prev);
    return;
    if (!editedRuleItems) return;
    setEditedRuleItems((prev) => [...prev, {
      key: `new-${Date.now()}`,
      name: '请选择收入类型',
      ratio: 0,
      team: '',
      baseType: '',
      originalRatio: null,
      originalTeam: null,
      isNew: true,
    }]);
  }, [editedRuleItems]);

  const handleConfirmAddRuleItem = useCallback((baseType) => {
    if (!editedRuleItems || !baseType) return;
    const escaped = baseType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}(\\d*)$`);
    const nums = editedRuleItems
      .filter((item) => regex.test(item.name))
      .map((item) => { const m = item.name.match(regex); return m[1] ? parseInt(m[1], 10) : 1; });
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    setEditedRuleItems((prev) => [...prev, {
      key: `new-${Date.now()}`,
      name: `${baseType}${maxNum + 1}`,
      ratio: 0,
      team: '',
      baseType,
      originalRatio: null,
      originalTeam: null,
      isNew: true,
    }]);
    setShowAddRuleTypePicker(false);
  }, [editedRuleItems]);

  const handleRemoveRuleItem = useCallback((itemKey) => {
    setEditedRuleItems((prev) => prev ? prev.filter((item) => item.key !== itemKey) : null);
  }, []);

  const handleResetRuleItems = useCallback(() => {
    if (matchedRule) {
      setEditedRuleItems(buildEditedItems(matchedRule));
      setShowAddRuleTypePicker(false);
    }
  }, [matchedRule, buildEditedItems]);

  const hasRuleRowChanged = useCallback((item) => (
    item?.isNew
    || item?.ratio !== item?.originalRatio
    || item?.team !== item?.originalTeam
  ), []);

  const ruleTableData = adjustRule ? (editedRuleItems || []) : originalRuleItems;

  const ruleSummary = useMemo(() => {
    const data = ruleTableData || [];
    const totalRatio = data.reduce((sum, item) => sum + (Number(item.ratio) || 0), 0);
    const changedCount = data.filter((item) => hasRuleRowChanged(item)).length;
    const newCount = data.filter((item) => item.isNew).length;
    const ratioPercent = Math.round(totalRatio * 100);
    const remainingPercent = Math.round((1 - totalRatio) * 100);
    const deltaPercent = ratioPercent - 100;
    return {
      itemCount: data.length,
      changedCount,
      newCount,
      ratioPercent,
      remainingPercent,
      deltaPercent,
      isBalanced: Math.abs(totalRatio - 1) < 0.0001,
    };
  }, [ruleTableData, hasRuleRowChanged]);

  const groupedRuleItems = useMemo(() => {
    return (editedRuleItems || []).reduce((acc, item) => {
      if (!acc[item.baseType]) acc[item.baseType] = [];
      acc[item.baseType].push(item);
      return acc;
    }, {});
  }, [editedRuleItems]);

  const ruleProgressPercent = Math.max(0, Math.min(ruleSummary.ratioPercent, 100));

  const handleToggleEdit = useCallback((key) => {
    setEditingKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleExistingItemChange = useCallback((key, field, value) => {
    setExistingItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    );
  }, []);

  const handleAddItem = useCallback(() => {
    setAdjustItems((prev) => [...prev, {
      key: Date.now(), project: '', detailNo: '', opType: '增加', opSubType: '调账-新增',
      changeAmount: '', confirmBase: '', ratio: '', confirmAmount: '',
      team: '', period: '', status: '新增',
    }]);
  }, []);

  const handleRemoveItem = useCallback((key) => {
    setAdjustItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const handleItemChange = useCallback((key, field, value) => {
    setAdjustItems((prev) => prev.map((item) =>
      item.key === key ? { ...item, [field]: value } : item
    ));
  }, []);

  const handleAddDeliveryItem = useCallback(() => {
    setDeliveryAdjustItems((prev) => [...prev, {
      key: Date.now(), project: '', detailNo: '', opType: '', opSubType: '',
      changeAmount: '', confirmBase: '', ratio: '', confirmAmount: '',
      team: '', period: '', status: '新增',
    }]);
  }, []);

  const handleRemoveDeliveryItem = useCallback((key) => {
    setDeliveryAdjustItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const handleDeliveryItemChange = useCallback((key, field, value) => {
    setDeliveryAdjustItems((prev) => prev.map((item) =>
      item.key === key ? { ...item, [field]: value } : item
    ));
  }, []);

  const handleSubmit = useCallback(() => {
    form.validateFields().then((values) => {
      if (!activeOrder) {
        messageApi.warning('请选择原始业务单号');
        return;
      }
      if (adjustItems.length === 0) {
        messageApi.warning('请至少新增一条调整项目');
        return;
      }
      if (adjustRule && !ruleSummary.isBalanced) {
        const tip = ruleSummary.deltaPercent > 0
          ? `当前规则比例超过 ${ruleSummary.deltaPercent}% ，请调整到 100% 后再提交`
          : `当前规则比例还差 ${Math.abs(ruleSummary.deltaPercent)}% ，请调整到 100% 后再提交`;
        messageApi.warning(tip);
        return;
      }
      const stored = getStoredAdjustmentOrders();
      const now = dayjs();
      const newOrder = {
        id: `TZO${String(stored.length + 1).padStart(3, '0')}`,
        adjustmentNo: `TZD${now.format('YYYYMMDD')}${String(stored.length + 1).padStart(4, '0')}`,
        adjustmentItem: values.adjustmentItems.join('、'),
        status: '待审批',
        relatedBusinessNo: activeOrder.orderNo,
        applicant: values.applicant,
        applicationTime: now.format('YYYY-MM-DD HH:mm:ss'),
        approvalTime: null,
        approvalNo: null,
      };
      stored.unshift(newOrder);
      saveAdjustmentOrders(stored);
      messageApi.success('调整单提交成功，等待审批');
      onBack();
    });
  }, [form, activeOrder, adjustItems, adjustRule, ruleSummary, messageApi, onBack]);

  const ruleColumns = [
    {
      title: '收入类型', dataIndex: 'name', width: 140,
      render: (name, r) => (
        adjustRule && r.isNew ? (
          <Select
            className="af-rule-select"
            value={r.baseType || undefined}
            placeholder="请选择收入类型"
            onChange={(value) => handleRuleBaseTypeChange(r.key, value)}
            options={baseTypeOptions}
          />
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="af-type-dot" style={{ background: revenueColorMap[r.baseType] || '#999' }} />
            {name}
          </span>
        )
      ),
    },
    {
      title: '比例', width: adjustRule ? 200 : 100, align: 'right',
      render: (_, r) => {
        if (!adjustRule) return `${Math.round(r.ratio * 100)}%`;
        const orig = r.originalRatio != null ? `${Math.round(r.originalRatio * 100)}%` : '-';
        return (
          <span className="af-rule-inline">
            <span className="af-rule-orig">{orig}</span>
            <span className="af-rule-arrow">→</span>
            <Input size="small" className="af-rule-input" value={Math.round(r.ratio * 100)} suffix="%"
              onChange={(e) => handleEditedRuleItemChange(r.key, 'ratio', Number(e.target.value) / 100)} />
          </span>
        );
      },
    },
    {
      title: '归属团队', width: adjustRule ? 260 : undefined, ellipsis: !adjustRule,
      render: (_, r) => {
        if (!adjustRule) return r.team;
        const orig = r.originalTeam || '-';
        return (
          <span className="af-rule-inline">
            <span className="af-rule-orig">{orig}</span>
            <span className="af-rule-arrow">→</span>
            <Select size="small" className="af-rule-input" value={r.team || undefined} placeholder="请选择"
              onChange={(v) => handleEditedRuleItemChange(r.key, 'team', v)} options={teamOptions} />
          </span>
        );
      },
    },
    ...(adjustRule ? [{
      title: '', width: 40, align: 'center',
      render: (_, r) => (
        <Button type="text" size="small" danger className="af-rule-del"
          onClick={() => handleRemoveRuleItem(r.key)}>×</Button>
      ),
    }] : []),
  ];

  const ruleDisplayColumns = [
    {
      title: '收入类型', dataIndex: 'name', width: 140,
      render: (name, r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="af-type-dot" style={{ background: revenueColorMap[r.baseType] || '#999' }} />
          {name}
        </span>
      ),
    },
    {
      title: '调整前比例', width: 120, align: 'right',
      render: (_, r) => `${Math.round((r.originalRatio ?? r.ratio) * 100)}%`,
    },
    ...(adjustRule ? [{
      title: '调整后比例', width: 180, align: 'right',
      render: (_, r) => (
        <div className="af-rule-cell">
          <InputNumber
            min={0}
            max={100}
            precision={0}
            addonAfter="%"
            value={Math.round((Number(r.ratio) || 0) * 100)}
            onChange={(value) => handleRuleRatioChange(r.key, value)}
            className="af-rule-input-number"
          />
        </div>
      ),
    }] : [{
      title: '当前比例', width: 120, align: 'right',
      align: 'left',
      render: (_, r) => <span className="af-rule-text-left">{`${Math.round(r.ratio * 100)}%`}</span>,
    }]),
    {
      title: '调整前团队', width: 180, ellipsis: true,
      render: (_, r) => <span className="af-rule-team-tag">{r.originalTeam || r.team || '-'}</span>,
    },
    ...(adjustRule ? [{
      title: '调整后团队', width: 220,
      render: (_, r) => (
        <div className="af-rule-cell">
          <Select
            className="af-rule-select"
            value={r.team || undefined}
            placeholder="请选择"
            onChange={(v) => handleEditedRuleItemChange(r.key, 'team', v)}
            options={teamOptions}
          />
        </div>
      ),
    }, {
      title: '', width: 56, align: 'center',
      render: (_, r) => (
        <Button
          type="text"
          size="small"
          danger
          className="af-rule-del"
          onClick={() => handleRemoveRuleItem(r.key)}
          icon={<DeleteOutlined />}
        />
      ),
    }] : [{
      title: '当前团队', width: 180, ellipsis: true,
      render: (_, r) => <span className="af-rule-team-tag af-rule-text-left">{r.team || '-'}</span>,
    }]),
  ];

  const ruleDisplayColumnsCompact = [
    {
      title: '收入类型', dataIndex: 'name', width: 140,
      render: (name, r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="af-type-dot" style={{ background: revenueColorMap[r.baseType] || '#999' }} />
          {name}
        </span>
      ),
    },
    {
      title: '当前比例', width: 120, align: 'right',
      render: (_, r) => `${Math.round(r.ratio * 100)}%`,
    },
    ...(adjustRule ? [{
      title: '调整前团队', width: 180, ellipsis: true,
      render: (_, r) => <span className="af-rule-team-tag">{r.originalTeam || r.team || '-'}</span>,
    }, {
      title: '调整后比例', width: 180, align: 'right',
      render: (_, r) => (
        <div className="af-rule-cell">
          <InputNumber
            min={0}
            max={100}
            precision={0}
            addonAfter="%"
            value={Math.round((Number(r.ratio) || 0) * 100)}
            onChange={(value) => handleRuleRatioChange(r.key, value)}
            className="af-rule-input-number"
          />
        </div>
      ),
    }, {
      title: '调整后团队', width: 220,
      render: (_, r) => (
        <div className="af-rule-cell">
          <Select
            className="af-rule-select"
            value={r.team || undefined}
            placeholder="请选择"
            onChange={(v) => handleEditedRuleItemChange(r.key, 'team', v)}
            options={teamOptions}
          />
        </div>
      ),
    }, {
      title: '', width: 56, align: 'center',
      render: (_, r) => (
        <Button
          type="text"
          size="small"
          danger
          className="af-rule-del"
          onClick={() => handleRemoveRuleItem(r.key)}
          icon={<DeleteOutlined />}
        />
      ),
    }] : [{
      title: '当前团队', width: 180, ellipsis: true,
      render: (_, r) => <span className="af-rule-team-tag">{r.team || '-'}</span>,
    }]),
  ];

  const businessTableData = useMemo(() => {
    const bizBaseTypes = selectedAdjustItems.filter(t => ['业务收入', '导流收入', '业务渠道分成'].includes(t));
    const filtered = existingItems.filter(item => {
      const match = revenueTypeMap.find(rt => rt.name === item.project);
      return match && bizBaseTypes.includes(match.baseType);
    });
    return [...filtered, ...adjustItems];
  }, [existingItems, adjustItems, selectedAdjustItems]);

  const bizColumns = [
    {
      title: '项目', dataIndex: 'project', width: 130,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.project}</span>;
        return (
          <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.project || undefined}
            onChange={(v) => r.isExisting ? handleExistingItemChange(r.key, 'project', v) : handleItemChange(r.key, 'project', v)}
            options={bizProjectOptions} />
        );
      },
    },
    {
      title: '明细单号', dataIndex: 'detailNo', width: 100,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.detailNo}</span>;
        return <Input size="small" value={r.detailNo} placeholder="" readOnly />;
      },
    },
    {
      title: '操作类型', dataIndex: 'opType', width: 100,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.opType}</span>;
        return (
          <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.opType || undefined}
            onChange={(v) => r.isExisting ? handleExistingItemChange(r.key, 'opType', v) : handleItemChange(r.key, 'opType', v)}
            options={operationTypeOptions} />
        );
      },
    },
    {
      title: '操作子类型', dataIndex: 'opSubType', width: 120,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.opSubType}</span>;
        return (
          <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.opSubType || undefined}
            onChange={(v) => r.isExisting ? handleExistingItemChange(r.key, 'opSubType', v) : handleItemChange(r.key, 'opSubType', v)}
            options={operationSubTypeOptions} />
        );
      },
    },
    {
      title: '变化金额(支付/退费等金额)', dataIndex: 'changeAmount', width: 170,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.changeAmount}</span>;
        return (
          <Input size="small" value={r.changeAmount} placeholder="请输入"
            onChange={(e) => r.isExisting ? handleExistingItemChange(r.key, 'changeAmount', e.target.value) : handleItemChange(r.key, 'changeAmount', e.target.value)} />
        );
      },
    },
    {
      title: <span style={{ whiteSpace: 'normal' }}>确认基数（元）*</span>, dataIndex: 'confirmBase', width: 130,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.confirmBase}</span>;
        return (
          <Input size="small" value={r.confirmBase} placeholder="请输入"
            onChange={(e) => r.isExisting ? handleExistingItemChange(r.key, 'confirmBase', e.target.value) : handleItemChange(r.key, 'confirmBase', e.target.value)} />
        );
      },
    },
    {
      title: <span style={{ whiteSpace: 'normal' }}>比例（%）*</span>, dataIndex: 'ratio', width: 110,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.ratio}%</span>;
        return (
          <Input size="small" value={r.ratio} placeholder="请输入" suffix="%"
            onChange={(e) => r.isExisting ? handleExistingItemChange(r.key, 'ratio', e.target.value) : handleItemChange(r.key, 'ratio', e.target.value)} />
        );
      },
    },
    {
      title: <span style={{ whiteSpace: 'normal' }}>确认金额（元）*</span>, dataIndex: 'confirmAmount', width: 130,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.confirmAmount}</span>;
        return (
          <Input size="small" value={r.confirmAmount} placeholder="请输入"
            onChange={(e) => r.isExisting ? handleExistingItemChange(r.key, 'confirmAmount', e.target.value) : handleItemChange(r.key, 'confirmAmount', e.target.value)} />
        );
      },
    },
    {
      title: '归属团队', dataIndex: 'team', width: 130,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.team}</span>;
        return (
          <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.team || undefined}
            onChange={(v) => r.isExisting ? handleExistingItemChange(r.key, 'team', v) : handleItemChange(r.key, 'team', v)}
            options={teamOptions} />
        );
      },
    },
    {
      title: '确认期数', dataIndex: 'period', width: 110,
      render: (_, r) => {
        if (r.isExisting && !editingKeys.has(r.key)) return <span>{r.period}</span>;
        return (
          <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.period || undefined}
            onChange={(v) => r.isExisting ? handleExistingItemChange(r.key, 'period', v) : handleItemChange(r.key, 'period', v)}
            options={periodOptions} />
        );
      },
    },
    {
      title: '确认状态', dataIndex: 'status', width: 90,
      render: (v) => <Tag color={v === '已确认' ? 'green' : v === '新增' ? 'blue' : 'default'}>{v}</Tag>,
    },
    {
      title: '操作', width: 70,
      render: (_, r) => {
        if (r.isExisting) {
          const isEditing = editingKeys.has(r.key);
          return (
            <Button type="link" size="small" onClick={() => handleToggleEdit(r.key)}>
              {isEditing ? '保存' : '修改'}
            </Button>
          );
        }
        return <Button type="link" size="small" danger onClick={() => handleRemoveItem(r.key)}>删除</Button>;
      },
    },
  ];

  const deliveryColumns = [
    {
      title: '项目', dataIndex: 'project', width: 130,
      render: (_, r) => (
        <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.project || undefined}
          onChange={(v) => handleDeliveryItemChange(r.key, 'project', v)} options={deliveryProjectOptions} />
      ),
    },
    {
      title: '明细单号', dataIndex: 'detailNo', width: 100,
      render: (_, r) => <Input size="small" value={r.detailNo} placeholder="" readOnly />,
    },
    {
      title: '操作类型', dataIndex: 'opType', width: 100,
      render: (_, r) => (
        <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.opType || undefined}
          onChange={(v) => handleDeliveryItemChange(r.key, 'opType', v)} options={operationTypeOptions} />
      ),
    },
    {
      title: '操作子类型', dataIndex: 'opSubType', width: 120,
      render: (_, r) => (
        <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.opSubType || undefined}
          onChange={(v) => handleDeliveryItemChange(r.key, 'opSubType', v)} options={operationSubTypeOptions} />
      ),
    },
    {
      title: '变化金额(支付/退费等金额)', dataIndex: 'changeAmount', width: 170,
      render: (_, r) => (
        <Input size="small" value={r.changeAmount} placeholder="请输入"
          onChange={(e) => handleDeliveryItemChange(r.key, 'changeAmount', e.target.value)} />
      ),
    },
    {
      title: <span style={{ whiteSpace: 'normal' }}>确认基数（元）*</span>, dataIndex: 'confirmBase', width: 130,
      render: (_, r) => (
        <Input size="small" value={r.confirmBase} placeholder="请输入"
          onChange={(e) => handleDeliveryItemChange(r.key, 'confirmBase', e.target.value)} />
      ),
    },
    {
      title: <span style={{ whiteSpace: 'normal' }}>比例（%）*</span>, dataIndex: 'ratio', width: 110,
      render: (_, r) => (
        <Input size="small" value={r.ratio} placeholder="请输入" suffix="%"
          onChange={(e) => handleDeliveryItemChange(r.key, 'ratio', e.target.value)} />
      ),
    },
    {
      title: <span style={{ whiteSpace: 'normal' }}>确认金额（元）*</span>, dataIndex: 'confirmAmount', width: 130,
      render: (_, r) => (
        <Input size="small" value={r.confirmAmount} placeholder="请输入"
          onChange={(e) => handleDeliveryItemChange(r.key, 'confirmAmount', e.target.value)} />
      ),
    },
    {
      title: '归属团队', dataIndex: 'team', width: 130,
      render: (_, r) => (
        <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.team || undefined}
          onChange={(v) => handleDeliveryItemChange(r.key, 'team', v)} options={teamOptions} />
      ),
    },
    {
      title: '确认期数', dataIndex: 'period', width: 110,
      render: (_, r) => (
        <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.period || undefined}
          onChange={(v) => handleDeliveryItemChange(r.key, 'period', v)} options={periodOptions} />
      ),
    },
    { title: '确认状态', dataIndex: 'status', width: 90, render: (v) => v },
    {
      title: '操作', width: 70,
      render: (_, r) => (
        <Button type="link" size="small" danger onClick={() => handleRemoveDeliveryItem(r.key)}>删除</Button>
      ),
    },
  ];

  const orderDetailColumns = [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '订单类型', dataIndex: 'orderType', width: 100 },
    { title: '产品归属', dataIndex: 'productAttribution', width: 240, ellipsis: true },
    { title: '产品类型', dataIndex: 'productType', width: 120 },
    { title: '产品信息/活动信息', dataIndex: 'product', width: 180, ellipsis: true },
    { title: '客户来源', dataIndex: 'buyerSource', width: 100 },
    { title: '客户购买阶段', dataIndex: 'purchaseStage', width: 120 },
    { title: '销售额', dataIndex: 'amount', width: 100, align: 'right', render: (v) => v || 0 },
    { title: '订单已支付金额', dataIndex: 'actualPayAmount', width: 130, align: 'right', render: (v) => v || 0 },
    { title: '订单退费金额', dataIndex: 'refundAmount', width: 120, align: 'right', render: (v) => v || 0 },
    { title: '员工姓名', dataIndex: 'employee', width: 100 },
    { title: '下单时客户负责人', dataIndex: 'team', width: 140 },
  ];

  const orderSelectColumns = [
    { title: '订单号', dataIndex: 'orderNo', width: 180, render: (t) => <a>{t}</a> },
    { title: '订单类型', dataIndex: 'orderType', width: 100 },
    { title: '产品', dataIndex: 'product', width: 200, ellipsis: true },
    { title: '买家', dataIndex: 'buyer', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v) => {
        const m = { '已完成': 'green', '已支付': 'blue', '待交付': 'orange', '已取消': 'red' };
        return <Tag color={m[v]}>{v}</Tag>;
      },
    },
    { title: '金额', dataIndex: 'amount', width: 120, align: 'right', render: (v) => `¥${v.toLocaleString()}` },
    {
      title: '操作', width: 80,
      render: (_, r) => {
        const isSelected = selectedOrders.some((o) => o.orderNo === r.orderNo);
        return (
          <Button type="link" size="small"
            onClick={() => handleToggleOrderSelect(r.orderNo)}
            style={isSelected ? { color: '#ff4d4f' } : {}}
          >
            {isSelected ? '取消' : '选择'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="af-page">
      {contextHolder}

      {/* Top bar */}
      <div className="af-topbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
        <span className="af-topbar-title">调整单申请</span>
      </div>

      {/* Body */}
      <div className="af-body">

        {/* Block: 基础信息 */}
        <div className="af-block">
          <Form form={form} layout="horizontal" labelAlign="left"
            labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}
            initialValues={{ applicant: '小吴(18576724595)', erpAccount: '冯建扬(B06816)', title: '调整收入' }}
          >
            <Form.Item label="申请人" name="applicant" rules={[{ required: true }]}>
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item label="申请人对应ERP账号" name="erpAccount" rules={[{ required: true }]}
              extra="手机号对应的ERP账号，如显示的账号不正确请修改手机号">
              <Input />
            </Form.Item>
            <Form.Item label="标题" name="title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              label={<FieldMark version="2.5" date="04-25" type="modified">调整项目</FieldMark>}
              name="adjustmentItems"
              rules={[{ required: true }]}
            >
              <Select mode="multiple" placeholder="请选择" options={adjustmentItemOptions} />
            </Form.Item>
            <Form.Item label="原始业务单号" required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button type="primary" ghost size="small" onClick={() => setOrderModalVisible(true)} style={{ width: 'fit-content' }}>选择业务单号</Button>
                {selectedOrders.length > 0 && (
                  <div className="af-order-tabs">
                    {selectedOrders.map((o, i) => (
                      <span
                        key={o.orderNo}
                        className={`af-order-tab ${i === activeOrderIndex ? 'af-order-tab-active' : ''}`}
                        onClick={() => handleSwitchOrder(i)}
                      >
                        {o.orderNo}
                        {i === activeOrderIndex && (
                          <span className="af-order-tab-close" onClick={(e) => { e.stopPropagation(); handleRemoveOrder(i); }}>×</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Form.Item>
          </Form>
        </div>

        {/* Block: 关联订单信息 */}
        {activeOrder && (
          <div className="af-block">
            <div className="af-section-title">关联订单信息</div>
            <Table
              dataSource={[activeOrder]} columns={orderDetailColumns} rowKey="orderNo"
              size="small" pagination={false} bordered scroll={{ x: 1600 }}
            />
          </div>
        )}

        {/* Block: 订单规则 */}
        {activeOrder && matchedRule && (
          <IterationMark version="2.4" date="04-24" type="new" label="订单规则模块" docKey="adjustment-order-rule">
          <div className="af-block">
            <div className="af-section-title">
              订单规则
            </div>
            <div className={`af-rule-panel ${adjustRule ? 'af-rule-panel-editing' : ''}`}>
              <div className="af-rule-header">
                <div className="af-rule-info">
                  <div className="af-rule-title-row">
                    <span className="af-rule-name">当前核算规则：<strong>{matchedRule.name}</strong></span>
                    <Tag color="blue">{matchedRule.version}</Tag>
                    <Tag color={matchedRule.status === '生效中' ? 'success' : 'default'}>{matchedRule.status}</Tag>
                  </div>
                  <div className="af-rule-summary">
                    <span className="af-rule-chip">收入类型 {ruleSummary.itemCount} 项</span>
                    <span className={`af-rule-chip ${ruleSummary.isBalanced ? 'is-ok' : 'is-warn'}`}>
                      比例合计 {ruleSummary.ratioPercent}%
                    </span>
                    <span className="af-rule-chip">匹配订单 {activeOrder.orderNo}</span>
                    {adjustRule && (
                      <span className="af-rule-chip is-active">
                        已调整 {ruleSummary.changedCount} 项
                      </span>
                    )}
                  </div>
                </div>
                <div className="af-rule-toggle">
                  <span>是否调整规则</span>
                  <Switch size="small" checked={adjustRule} onChange={handleAdjustRuleChange} />
                </div>
                <div className="af-rule-switch">
                  <span>是否调整规则</span>
                  {adjustRule ? (
                    <>
                      <Button icon={<CloseOutlined />} onClick={() => handleAdjustRuleChange(false)}>
                        退出调整
                      </Button>
                      <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAdjustRuleChange(false)}>
                        完成调整
                      </Button>
                    </>
                  ) : (
                    <Button type="primary" icon={<EditOutlined />} onClick={() => handleAdjustRuleChange(true)}>
                      调整规则
                    </Button>
                  )}
                </div>
              </div>
              <div className="af-rule-health">
                <div className="af-rule-health-main">
                  <div className="af-rule-health-label">分摊进度</div>
                  <div className="af-rule-health-value">{ruleSummary.ratioPercent}%</div>
                  <div className="af-rule-progress">
                    <span className="af-rule-progress-bar" style={{ width: `${ruleProgressPercent}%` }} />
                  </div>
                </div>
                <div className={`af-rule-health-side ${ruleSummary.isBalanced ? 'is-ok' : 'is-warn'}`}>
                  <div className="af-rule-health-side-label">提交状态</div>
                  <div className="af-rule-health-side-value">
                    {ruleSummary.isBalanced ? '已平衡，可提交' : `还差 ${Math.abs(ruleSummary.remainingPercent)}%`}
                  </div>
                  <div className="af-rule-health-side-desc">
                    {ruleSummary.isBalanced ? '当前比例已对齐 100%，可以继续调整团队归属。' : '先把比例补足到 100%，再提交调整单。'}
                  </div>
                </div>
              </div>
            </div>
            <div className="af-rule-health af-rule-health-v2">
              <div className="af-rule-health-main">
                <div className="af-rule-health-label">分摊进度</div>
                <div className="af-rule-health-value">{ruleSummary.ratioPercent}%</div>
                <div className="af-rule-progress">
                  <span className="af-rule-progress-bar" style={{ width: `${ruleProgressPercent}%` }} />
                </div>
              </div>
              <div className={`af-rule-health-side ${ruleSummary.isBalanced ? 'is-ok' : 'is-warn'}`}>
                <div className="af-rule-health-side-label">提交状态</div>
                <div className="af-rule-health-side-value">
                  {ruleSummary.isBalanced
                    ? '已平衡，可提交'
                    : ruleSummary.deltaPercent > 0
                      ? `超过 ${ruleSummary.deltaPercent}%`
                      : `还差 ${Math.abs(ruleSummary.deltaPercent)}%`}
                </div>
                <div className="af-rule-health-side-desc">
                  {ruleSummary.isBalanced
                    ? '当前比例正好 100%，可以继续填写调整后的比例和团队。'
                    : '比例不等于 100% 时，不允许提交调整单。'}
                </div>
              </div>
            </div>
            {adjustRule && (
              <div className="af-rule-actions">
                <div className={`af-rule-balance-tip ${ruleSummary.isBalanced ? 'is-ok' : 'is-warn'}`}>
                  {ruleSummary.isBalanced ? '当前比例已平衡，可继续调整团队归属。' : '当前比例合计未达到 100%，提交前请先校准。'}
                </div>
                <Space size="small" wrap>
                  <Popover
                    trigger="click"
                    placement="bottomLeft"
                    open={showAddRuleTypePicker}
                    onOpenChange={setShowAddRuleTypePicker}
                    content={(
                      <div className="af-rule-add-popover">
                        <div className="af-rule-add-picker-label">选择收入类型</div>
                        <div className="af-rule-add-popover-list">
                          {baseTypeOptions.map((option) => (
                            <Button key={option.value} size="small" block onClick={() => handleConfirmAddRuleItem(option.value)}>
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  >
                    <Button size="small" type="primary" ghost icon={<PlusOutlined />}>新增收入类型</Button>
                  </Popover>
                  <Button size="small" icon={<UndoOutlined />} onClick={handleResetRuleItems} disabled={ruleSummary.changedCount === 0}>重置</Button>
                </Space>
              </div>
            )}
            <Table
              dataSource={ruleTableData}
              columns={ruleDisplayColumnsCompact} rowKey="key"
              size="small" pagination={false} bordered
              scroll={{ x: 980 }}
              className="af-edit-table af-rule-table af-rule-table-v2"
              rowClassName={(record) => {
                if (!adjustRule) return '';
                if (record.isNew) return 'af-rule-row-new';
                if (hasRuleRowChanged(record)) return 'af-rule-row-changed';
                return '';
              }}
            />
            {false && adjustRule ? (
              <div className="af-rule-editor">
                {Object.entries(groupedRuleItems).map(([baseType, items]) => (
                  <div className="af-rule-group" key={baseType}>
                    <div className="af-rule-group-header">
                      <span className="af-type-dot" style={{ background: revenueColorMap[baseType] || '#999' }} />
                      <span>{baseType}</span>
                      <span className="af-rule-group-count">{items.length} 项</span>
                    </div>
                    <div className="af-rule-card-grid">
                      {items.map((item) => {
                        const changed = hasRuleRowChanged(item);
                        const originalRatio = item.originalRatio != null ? Math.round(item.originalRatio * 100) : null;
                        const currentRatio = Math.round((Number(item.ratio) || 0) * 100);
                        return (
                          <div
                            key={item.key}
                            className={`af-rule-card ${item.isNew ? 'is-new' : ''} ${changed ? 'is-changed' : ''}`}
                          >
                            <div className="af-rule-card-head">
                              <div className="af-rule-card-title">
                                <span className="af-type-dot" style={{ background: revenueColorMap[item.baseType] || '#999' }} />
                                <span>{item.name}</span>
                              </div>
                              <div className="af-rule-card-tags">
                                {item.isNew && <span className="af-rule-mini-tag is-new">新增</span>}
                                {changed && !item.isNew && <span className="af-rule-mini-tag is-changed">已修改</span>}
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  className="af-rule-del"
                                  onClick={() => handleRemoveRuleItem(item.key)}
                                  icon={<DeleteOutlined />}
                                />
                              </div>
                            </div>
                            <div className="af-rule-card-meta">
                              <div>原比例：{originalRatio == null ? '-' : `${originalRatio}%`}</div>
                              <div>原团队：{item.originalTeam || '-'}</div>
                            </div>
                            <div className="af-rule-card-fields">
                              <div className="af-rule-field">
                                <span className="af-rule-field-label">调整后比例</span>
                                <InputNumber
                                  min={0}
                                  max={100}
                                  precision={0}
                                  addonAfter="%"
                                  value={currentRatio}
                                  onChange={(value) => handleRuleRatioChange(item.key, value)}
                                  className="af-rule-card-input"
                                />
                              </div>
                              <div className="af-rule-field">
                                <span className="af-rule-field-label">归属团队</span>
                                <Select
                                  className="af-rule-card-input"
                                  value={item.team || undefined}
                                  placeholder="请选择"
                                  onChange={(value) => handleEditedRuleItemChange(item.key, 'team', value)}
                                  options={teamOptions}
                                />
                              </div>
                            </div>
                            <div className="af-rule-card-foot">
                              <span>当前占比 <strong>{currentRatio}%</strong></span>
                              <span>{originalRatio == null ? '新增加项' : `变化 ${currentRatio - originalRatio > 0 ? '+' : ''}${currentRatio - originalRatio}%`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table
                dataSource={ruleTableData}
                columns={ruleColumns} rowKey="key"
                size="small" pagination={false} bordered
                className="af-edit-table af-rule-table"
              />
            )}
          </div>
          </IterationMark>
        )}

        {/* Block: 业务信息 */}
        {showBizModule && (
        <div className="af-block">
          <div className="af-section-title">业务信息</div>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddItem}
            style={{ marginBottom: 8 }}>新增调整项目</Button>
          <Table
            dataSource={businessTableData} columns={bizColumns} rowKey="key"
            size="small" pagination={false} bordered scroll={{ x: 1500 }}
            className="af-edit-table af-biz-table"
            rowClassName={(record) =>
              record.isExisting
                ? (editingKeys.has(record.key) ? 'af-row-editing' : 'af-row-existing')
                : 'af-row-new'
            }
          />
        </div>
        )}

        {/* Block: 交付信息 — 横向表格 */}
        {showDeliveryModule && (
        <div className="af-block">
          <div className="af-section-title">交付信息</div>
          <table className="af-dl-table">
            <thead>
              <tr>
                <th>交付单号</th>
                <th>订单号</th>
                <th>订单类型</th>
                <th>产品归属</th>
                <th>产品类型</th>
                <th>产品信息/活动信息</th>
                <th>客户来源</th>
                <th>客户购买阶段</th>
                <th>已交付金额</th>
                <th>待交付金额</th>
                <th>退费金额</th>
                <th>员工姓名</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><Input placeholder="请输入" /></td>
                <td><Input value={activeOrder?.orderNo || ''} readOnly /></td>
                <td><Input value={activeOrder?.orderType || ''} readOnly /></td>
                <td><Input value={activeOrder?.productAttribution || ''} readOnly /></td>
                <td><Input value={activeOrder?.productType || ''} readOnly /></td>
                <td><Input value={activeOrder?.product || ''} readOnly /></td>
                <td><Input value={activeOrder?.buyerSource || ''} readOnly /></td>
                <td><Input placeholder="请输入" /></td>
                <td><Input placeholder="请输入" /></td>
                <td><Input placeholder="请输入" /></td>
                <td><Input placeholder="请输入" /></td>
                <td><Input value={activeOrder?.employee || ''} readOnly /></td>
              </tr>
            </tbody>
          </table>

          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddDeliveryItem}
            style={{ marginBottom: 8, marginTop: 12 }}>新增调整项目</Button>
          <Table
            dataSource={deliveryAdjustItems} columns={deliveryColumns} rowKey="key"
            size="small" pagination={false} bordered scroll={{ x: 1500 }}
            className="af-edit-table"
          />
        </div>
        )}

        {/* Block: 调整原因 / 审批人 / 附件 / 备注 */}
        <div className="af-block">
          <div className="af-bottom-row">
            <div className="af-bottom-label"><span className="af-required">*</span> 调整原因</div>
            <div className="af-bottom-field">
              <Select placeholder="请选择" style={{ width: '100%' }} options={reasonOptions} />
            </div>
          </div>
          <div className="af-bottom-row">
            <div className="af-bottom-label">指定审批人</div>
            <div className="af-bottom-field">
              <Select placeholder="请选择" style={{ width: '100%' }} defaultValue="超级管理员" options={approverOptions} />
            </div>
          </div>
          <div className="af-bottom-row">
            <div className="af-bottom-label">附件</div>
            <div className="af-bottom-field">
              <Upload>
                <Button icon={<UploadOutlined />}>选择附件</Button>
              </Upload>
              <div className="af-upload-hint">支持doc,docx,xls,xlsx,pdf,jpg,jpeg,png格式，最多9个文件，单个文件不超过20MB</div>
            </div>
          </div>
          <div className="af-bottom-row">
            <div className="af-bottom-label">备注</div>
            <div className="af-bottom-field">
              <TextArea rows={3} placeholder="请输入" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="af-footer">
          <Space size="middle">
            <Button type="primary" onClick={handleSubmit}>确认</Button>
            <Button onClick={onBack}>取消</Button>
          </Space>
        </div>
      </div>

      {/* Order Select Modal */}
      {orderModalVisible && (
        <div className="af-modal-mask" onClick={() => setOrderModalVisible(false)}>
          <div className="af-modal" onClick={(e) => e.stopPropagation()}>
            <div className="af-modal-title">选择业务单号</div>
            <Table
              dataSource={orders} columns={orderSelectColumns} rowKey="orderNo"
              size="small" pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条` }} scroll={{ x: 800 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
