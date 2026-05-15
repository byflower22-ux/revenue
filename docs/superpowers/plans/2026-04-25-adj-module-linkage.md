# 调整申请页模块联动 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现调整项目→订单规则→业务信息/交付信息的三方联动

**Architecture:** 在现有 AdjustmentFormPage.jsx 组件内，通过 Form.useWatch 监听调整项目字段变化，派生模块显示状态和动态下拉选项。项目下拉从 editedRuleItems（规则模块数据源）实时读取。

**Tech Stack:** React, Ant Design (Form, Select, Table), 纯JS无TypeScript

**Spec:** `docs/superpowers/specs/2026-04-25-adj-module-linkage-design.md`

---

### Task 1: 修改调整项目选项为4个基础类型

**Files:**
- Modify: `开发代码/accounting-demo/src/AdjustmentFormPage.jsx:36-42`

- [ ] **Step 1: 修改 `adjustmentItemOptions` 常量**

将第36-42行的5个独立选项改为4个基础类型：

```javascript
const adjustmentItemOptions = [
  { value: '业务收入', label: '业务收入' },
  { value: '导流收入', label: '导流收入' },
  { value: '业务渠道分成', label: '业务渠道分成' },
  { value: '交付收入', label: '交付收入' },
];
```

- [ ] **Step 2: 启动开发服务器验证下拉选项**

Run: `cd 开发代码/accounting-demo && npm run dev`

打开浏览器进入调整单新增页面，确认【调整项目】下拉显示4个选项：业务收入、导流收入、业务渠道分成、交付收入。

- [ ] **Step 3: Commit**

```bash
git add 开发代码/accounting-demo/src/AdjustmentFormPage.jsx
git commit -m "refactor: 调整项目选项从5个独立项改为4个基础类型"
```

---

### Task 2: 添加模块显示状态和动态下拉选项的派生逻辑

**Files:**
- Modify: `开发代码/accounting-demo/src/AdjustmentFormPage.jsx`

- [ ] **Step 1: 在组件内添加 `Form.useWatch` 监听和派生状态**

在第93行（`const [addRuleType, setAddRuleType] = useState('业务收入');` 之后）添加：

```javascript
const selectedAdjustItems = Form.useWatch('adjustmentItems', form) || [];

const showBizModule = selectedAdjustItems.some(item =>
  ['业务收入', '导流收入', '业务渠道分成'].includes(item)
);
const showDeliveryModule = selectedAdjustItems.includes('交付收入');

const bizProjectOptions = useMemo(() => {
  if (!editedRuleItems) return [];
  return editedRuleItems
    .filter(item =>
      ['业务收入', '导流收入', '业务渠道分成'].includes(item.baseType)
      && selectedAdjustItems.includes(item.baseType)
    )
    .map(item => ({ value: item.name, label: item.name }));
}, [editedRuleItems, selectedAdjustItems]);

const deliveryProjectOptions = useMemo(() => {
  if (!editedRuleItems) return [];
  return editedRuleItems
    .filter(item => item.baseType === '交付收入')
    .map(item => ({ value: item.name, label: item.name }));
}, [editedRuleItems]);
```

- [ ] **Step 2: 在浏览器中用 console.log 验证派生逻辑**

在派生状态后临时加一行：
```javascript
console.log('showBizModule:', showBizModule, 'showDeliveryModule:', showDeliveryModule, 'bizOpts:', bizProjectOptions);
```

选择调整项目后打开浏览器控制台，确认值正确变化后删除这行。

- [ ] **Step 3: Commit**

```bash
git add 开发代码/accounting-demo/src/AdjustmentFormPage.jsx
git commit -m "feat: 添加模块显示状态和动态下拉选项的派生逻辑"
```

---

### Task 3: 业务信息表格项目下拉改用动态选项

**Files:**
- Modify: `开发代码/accounting-demo/src/AdjustmentFormPage.jsx:606-616`（bizColumns 的项目列）

- [ ] **Step 1: 修改 bizColumns 中项目列的 options**

将第614行的 `options={adjustmentItemOptions}` 改为 `options={bizProjectOptions}`：

```javascript
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
```

- [ ] **Step 2: 验证业务信息下拉联动**

在浏览器中：选择"业务收入"调整项目 → 选择关联订单 → 在订单规则区点击"新增收入类型"选择"业务收入"→ 确认业务信息表格的【项目】下拉出现"业务收入3"。

- [ ] **Step 3: Commit**

```bash
git add 开发代码/accounting-demo/src/AdjustmentFormPage.jsx
git commit -m "feat: 业务信息项目下拉改为从规则模块动态读取"
```

---

### Task 4: 交付信息表格项目下拉改用动态选项

**Files:**
- Modify: `开发代码/accounting-demo/src/AdjustmentFormPage.jsx:729-736`（deliveryColumns 的项目列）

- [ ] **Step 1: 修改 deliveryColumns 中项目列的 options**

将第734行的 `options={adjustmentItemOptions}` 改为 `options={deliveryProjectOptions}`：

```javascript
{
  title: '项目', dataIndex: 'project', width: 130,
  render: (_, r) => (
    <Select size="small" style={{ width: '100%' }} placeholder="请选择" value={r.project || undefined}
      onChange={(v) => handleDeliveryItemChange(r.key, 'project', v)} options={deliveryProjectOptions} />
  );
},
```

- [ ] **Step 2: 验证交付信息下拉联动**

在浏览器中：选择"交付收入"调整项目 → 选择关联订单 → 确认交付信息表格的【项目】下拉显示"交付收入"。在规则区新增"交付收入"类型后确认下拉自动更新。

- [ ] **Step 3: Commit**

```bash
git add 开发代码/accounting-demo/src/AdjustmentFormPage.jsx
git commit -m "feat: 交付信息项目下拉改为从规则模块动态读取"
```

---

### Task 5: 业务信息模块条件显示

**Files:**
- Modify: `开发代码/accounting-demo/src/AdjustmentFormPage.jsx:1137-1152`

- [ ] **Step 1: 给业务信息区块加条件渲染**

将第1137-1152行从：
```jsx
{/* Block: 业务信息 */}
<div className="af-block">
  ...
</div>
```

改为：
```jsx
{/* Block: 业务信息 */}
{showBizModule && (
<div className="af-block">
  ...
</div>
)}
```

注意：只在外层加 `{showBizModule && (...)}` 条件，内部代码不变。

- [ ] **Step 2: 验证条件显示**

在浏览器中：
- 未选调整项目 → 业务信息不可见
- 只选"交付收入" → 业务信息不可见
- 选"业务收入" → 业务信息出现
- 选"业务收入"+"交付收入" → 业务信息和交付信息都出现，业务信息在上

- [ ] **Step 3: Commit**

```bash
git add 开发代码/accounting-demo/src/AdjustmentFormPage.jsx
git commit -m "feat: 业务信息模块根据调整项目条件显示"
```

---

### Task 6: 交付信息模块条件显示

**Files:**
- Modify: `开发代码/accounting-demo/src/AdjustmentFormPage.jsx:1154-1199`

- [ ] **Step 1: 给交付信息区块加条件渲染**

将第1154-1199行从：
```jsx
{/* Block: 交付信息 — 横向表格 */}
<div className="af-block">
  ...
</div>
```

改为：
```jsx
{/* Block: 交付信息 — 横向表格 */}
{showDeliveryModule && (
<div className="af-block">
  ...
</div>
)}
```

- [ ] **Step 2: 完整回归验证**

在浏览器中测试所有场景：
1. 未选调整项目 → 两个模块都不可见
2. 只选"业务收入" → 只有业务信息
3. 只选"交付收入" → 只有交付信息
4. 选"业务收入"+"导流收入"+"交付收入" → 两个都显示，业务信息在上
5. 取消选择后重新选择 → 模块正确切换
6. 规则区新增收入类型 → 下拉实时更新
7. 表格编辑、新增行、删除行功能正常
8. 提交按钮功能正常

- [ ] **Step 3: Commit**

```bash
git add 开发代码/accounting-demo/src/AdjustmentFormPage.jsx
git commit -m "feat: 交付信息模块根据调整项目条件显示，完成三方联动"
```

---

### Task 7: 更新 CHANGELOG

**Files:**
- Modify: `版本管理/CHANGELOG.md`

- [ ] **Step 1: 在 CHANGELOG 的 [Unreleased] 下添加条目**

在 `## [Unreleased]` 的 `### 新增 (Added)` 或 `### 变更 (Changed)` 下添加：

```markdown
### 变更 (Changed)
- [调整单] 调整项目选项从5个独立项改为4个基础类型（业务收入、导流收入、业务渠道分成、交付收入）

### 新增 (Added)
- [调整单] 业务信息/交付信息模块根据调整项目选择条件显示
- [调整单] 业务信息/交付信息的项目下拉从订单规则模块动态读取，规则新增类型后下拉自动更新
```

- [ ] **Step 2: Commit**

```bash
git add 版本管理/CHANGELOG.md
git commit -m "docs: 更新CHANGELOG记录调整单模块联动功能"
```
