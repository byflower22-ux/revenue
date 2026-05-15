# 调整申请页 - 业务信息/交付信息模块联动设计

## 概述

调整申请页（AdjustmentFormPage.jsx）的业务信息和交付信息模块当前始终显示。本设计将其改为根据【调整项目】选择条件显示，并实现项目下拉与订单规则模块的三方联动。

## 变更范围

仅修改 `AdjustmentFormPage.jsx` 一个文件。

## 设计详案

### 1. 调整项目选项改为4个基础类型

**位置：** 第36-42行 `adjustmentItemOptions`

**改动：** 将5个独立选项（业务收入1、业务收入2、导流收入、业务渠道分成、交付收入）改为4个基础类型选项，与 `baseTypeOptions` 保持一致。

```javascript
// 改前
const adjustmentItemOptions = [
  { value: '业务收入1', label: '业务收入1' },
  { value: '业务收入2', label: '业务收入2' },
  { value: '导流收入', label: '导流收入' },
  { value: '业务渠道分成', label: '业务渠道分成' },
  { value: '交付收入', label: '交付收入' },
];

// 改后
const adjustmentItemOptions = [
  { value: '业务收入', label: '业务收入' },
  { value: '导流收入', label: '导流收入' },
  { value: '业务渠道分成', label: '业务渠道分成' },
  { value: '交付收入', label: '交付收入' },
];
```

### 2. 模块条件显示

**实现方式：** 使用 `Form.useWatch('adjustmentItem')` 监听调整项目字段变化。

**派生状态：**
```javascript
const selectedItems = Form.useWatch('adjustmentItem', form) || [];
const showBizModule = selectedItems.some(item =>
  ['业务收入', '导流收入', '业务渠道分成'].includes(item)
);
const showDeliveryModule = selectedItems.includes('交付收入');
```

**条件渲染：**
- 业务信息区块：外层加 `{showBizModule && (...)}`  条件渲染
- 交付信息区块：外层加 `{showDeliveryModule && (...)}`  条件渲染
- 两者都显示时，业务信息在上（保持现有DOM顺序）

**行为规则：**
- 未选择任何调整项目时，两个模块均隐藏
- 取消选择导致模块隐藏时，该模块内已填数据保留在 state 中不清除（避免误操作丢失数据）

### 3. 项目下拉从规则模块动态读取

**数据来源：** `editedRuleItems` 状态（订单规则模块的实际收入类型列表）

**过滤逻辑：**
```javascript
// 业务信息的项目选项
const bizProjectOptions = useMemo(() => {
  if (!editedRuleItems) return [];
  return editedRuleItems
    .filter(item =>
      ['业务收入', '导流收入', '业务渠道分成'].includes(item.baseType)
      && selectedItems.includes(item.baseType)
    )
    .map(item => ({ value: item.name, label: item.name }));
}, [editedRuleItems, selectedItems]);

// 交付信息的项目选项
const deliveryProjectOptions = useMemo(() => {
  if (!editedRuleItems) return [];
  return editedRuleItems
    .filter(item => item.baseType === '交付收入')
    .map(item => ({ value: item.name, label: item.name }));
}, [editedRuleItems]);
```

**联动效果：**
- 规则模块通过"新增收入类型"添加了"业务收入3"后，`editedRuleItems` 增加 `{name: '业务收入3', baseType: '业务收入', ...}`
- `bizProjectOptions` 自动包含"业务收入3"
- 业务信息表格的"项目"下拉实时更新

**影响范围：**
- `handleAddItem` 函数中新建行时，project 字段的下拉选项改用动态 options
- `businessTableData` 的表格列定义中，project 列的 select options 改为 `bizProjectOptions`
- `deliveryAdjustItems` 的表格列定义中，project 列的 select options 改为 `deliveryProjectOptions`

## 不变的部分

- 业务信息和交付信息的表格列结构不变
- 规则模块的新增/编辑功能不变
- 底部区域（调整原因、审批人、附件、备注）不变
- 提交逻辑不变
- 关联订单信息和订单选择模态框不变

## 验收标准

- [ ] 调整项目显示4个基础类型选项
- [ ] 只选业务收入/导流收入/业务渠道分成时，仅显示业务信息模块
- [ ] 只选交付收入时，仅显示交付信息模块
- [ ] 同时选两种类型时，两个模块都显示，业务信息在上
- [ ] 未选择调整项目时，两个模块均隐藏
- [ ] 业务信息的项目下拉仅显示与选中基础类型匹配的收入类型
- [ ] 交付信息的项目下拉仅显示交付收入类型
- [ ] 规则模块新增"业务收入3"后，业务信息项目下拉自动出现该选项
- [ ] 已有功能的表格编辑、提交等不受影响
