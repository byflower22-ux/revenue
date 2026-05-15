# 迭代标记系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在页面中添加迭代标记和文档链接层，支持开关切换和版本筛选，纯净模式下无额外 DOM 输出。

**Architecture:** 在 `src/demo/` 独立目录中创建 DemoProvider + IterationMark/FieldMark 组件体系。通过 React Context 控制演示/纯净模式切换。原始页面组件仅需 import 并用标记组件包裹对应区块，纯净模式下标记组件透明渲染 children。

**Tech Stack:** React 19, Ant Design 6 (Drawer/Switch/Tag/Popover), CSS Modules

---

### Task 1: 创建 DemoProvider 和 iterations 配置

**Files:**
- Create: `src/demo/DemoProvider.jsx`
- Create: `src/demo/iterations.js`

- [ ] **Step 1: 创建 iterations.js 配置文件**

```jsx
// src/demo/iterations.js
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
};
```

- [ ] **Step 2: 创建 DemoProvider.jsx**

```jsx
// src/demo/DemoProvider.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const DemoContext = createContext(null);

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) return { demoMode: false, activeVersion: 'all', isDimmed: () => false };
  return ctx;
}

export function DemoProvider({ children }) {
  const [demoMode, setDemoMode] = useState(true);
  const [activeVersion, setActiveVersion] = useState('all');

  const toggleDemo = useCallback(() => setDemoMode(prev => !prev), []);
  const filterVersion = useCallback((ver) => setActiveVersion(ver), []);

  const isDimmed = useCallback((version) => {
    if (activeVersion === 'all') return false;
    return version !== activeVersion;
  }, [activeVersion]);

  return (
    <DemoContext.Provider value={{ demoMode, activeVersion, toggleDemo, filterVersion, isDimmed }}>
      {children}
    </DemoContext.Provider>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd "D:/wzz/wzz/Revenue/开发代码/accounting-demo"
git add src/demo/DemoProvider.jsx src/demo/iterations.js
git commit -m "feat(demo): add DemoProvider and iterations config"
```

---

### Task 2: 创建 IterationMark 组件

**Files:**
- Create: `src/demo/IterationMark.jsx`

- [ ] **Step 1: 创建 IterationMark 组件**

区域级标记：包裹一个功能区块，演示模式下显示顶部徽章组（版本号、类型标签、PRD/流程图链接），点击可打开抽屉。

```jsx
// src/demo/IterationMark.jsx
import { useState } from 'react';
import { useDemo } from './DemoProvider';
import { iterations } from './iterations';

const typeConfig = {
  new: { label: '新增', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  modified: { label: '修改', color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
  optimized: { label: '优化', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
};

export default function IterationMark({ children, version, date, type = 'new', label, docKey }) {
  const { demoMode, isDimmed } = useDemo();
  const [hover, setHover] = useState(false);

  if (!demoMode) return <>{children}</>;

  const dimmed = isDimmed(version);
  const tc = typeConfig[type] || typeConfig.new;
  const ver = iterations.versions.find(v => v.key === version);
  const verLabel = ver ? `${ver.label} (${ver.date})` : `${version}迭代 (${date})`;

  const handleClickBadge = (e, action) => {
    e.stopPropagation();
    if (window.__openDocDrawer) {
      window.__openDocDrawer({ title: label, version, date, type, docKey, tab: action });
    }
  };

  const doc = docKey ? iterations.docs[docKey] : null;

  return (
    <div
      className={`demo-iteration-mark ${dimmed ? 'demo-dimmed' : ''} ${hover ? 'demo-hover' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="demo-iteration-badges">
        <span
          className="demo-badge demo-badge-version"
          onClick={(e) => handleClickBadge(e)}
        >
          {verLabel}
        </span>
        <span className="demo-badge" style={{ background: tc.color, color: '#fff' }}>
          {tc.label}
        </span>
        {doc && doc.prd && (
          <span
            className="demo-badge demo-badge-link"
            onClick={(e) => handleClickBadge(e, 'doc')}
          >
            📄 PRD
          </span>
        )}
        {doc && doc.flow && (
          <span
            className="demo-badge demo-badge-flow"
            onClick={(e) => handleClickBadge(e, 'flow')}
          >
            🔀 流程图
          </span>
        )}
      </div>
      <div className="demo-iteration-content">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/demo/IterationMark.jsx
git commit -m "feat(demo): add IterationMark component"
```

---

### Task 3: 创建 FieldMark 组件

**Files:**
- Create: `src/demo/FieldMark.jsx`

- [ ] **Step 1: 创建 FieldMark 组件**

字段级标记：在字段 label 旁渲染小标签，并给字段容器添加高亮样式。

```jsx
// src/demo/FieldMark.jsx
import { useDemo } from './DemoProvider';

const typeConfig = {
  new: { label: '新增', icon: '✨', cssClass: 'demo-field-new' },
  modified: { label: '修改', icon: '✏️', cssClass: 'demo-field-modified' },
  optimized: { label: '优化', icon: '🔧', cssClass: 'demo-field-optimized' },
};

export default function FieldMark({ children, version, date, type = 'new', docKey }) {
  const { demoMode, isDimmed } = useDemo();

  if (!demoMode) return <>{children}</>;

  const dimmed = isDimmed(version);
  const tc = typeConfig[type] || typeConfig.new;

  const handleClick = (e) => {
    e.stopPropagation();
    if (window.__openDocDrawer) {
      window.__openDocDrawer({ title: '', version, date, type, docKey, tab: 'doc' });
    }
  };

  return (
    <span className={`demo-field-mark ${dimmed ? 'demo-dimmed' : ''} ${tc.cssClass}`}>
      {typeof children === 'string'
        ? <>{children} <span className="demo-field-tag" onClick={handleClick}>{tc.icon} {version}{tc.label}</span></>
        : children
      }
    </span>
  );
}

export function FieldWrap({ children, version, type = 'new' }) {
  const { demoMode, isDimmed } = useDemo();
  if (!demoMode) return <>{children}</>;

  const dimmed = isDimmed(version);
  const tc = typeConfig[type] || typeConfig.new;

  return (
    <span className={`demo-field-wrap ${tc.cssClass} ${dimmed ? 'demo-dimmed' : ''}`}>
      {children}
    </span>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/demo/FieldMark.jsx
git commit -m "feat(demo): add FieldMark component"
```

---

### Task 4: 创建 DocDrawer 组件

**Files:**
- Create: `src/demo/DocDrawer.jsx`

- [ ] **Step 1: 创建 DocDrawer 组件**

侧边抽屉，双 Tab 展示 PRD 和流程图。通过 `window.__openDocDrawer` 全局方法打开。

```jsx
// src/demo/DocDrawer.jsx
import { useState, useEffect } from 'react';
import { Drawer, Tabs, Tag } from 'antd';
import { useDemo } from './DemoProvider';
import { iterations } from './iterations';

const typeColors = { new: 'green', modified: 'orange', optimized: 'purple' };
const typeLabels = { new: '新增', modified: '修改', optimized: '优化' };

export default function DocDrawer() {
  const { demoMode } = useDemo();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('doc');

  useEffect(() => {
    window.__openDocDrawer = (data) => {
      setInfo(data);
      setOpen(true);
      setActiveTab(data.tab || 'doc');
    };
    return () => { delete window.__openDocDrawer; };
  }, []);

  if (!demoMode || !info) return null;

  const doc = info.docKey ? iterations.docs[info.docKey] : null;

  return (
    <Drawer
      title={null}
      placement="right"
      width={420}
      open={open}
      onClose={() => setOpen(false)}
      closable={false}
      styles={{ body: { padding: 0 } }}
    >
      <div className="demo-drawer-header">
        <div>
          <div className="demo-drawer-title">{info.title || doc?.title || '迭代标记'}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <Tag color="blue">{info.version}迭代 ({info.date})</Tag>
            <Tag color={typeColors[info.type]}>{typeLabels[info.type]}</Tag>
          </div>
        </div>
        <span className="demo-drawer-close" onClick={() => setOpen(false)}>✕</span>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'doc',
            label: '需求文档',
            children: (
              <div className="demo-drawer-body">
                {doc?.prd ? (
                  <div className="demo-drawer-doc-content">
                    <p>📄 文档路径：<code>{doc.prd}</code></p>
                    <p style={{ color: '#999', fontSize: 12 }}>完整 PRD 内容请查看项目需求文档目录</p>
                    {doc.title && <h4>{doc.title}</h4>}
                  </div>
                ) : (
                  <div className="demo-drawer-empty">暂无关联需求文档</div>
                )}
              </div>
            ),
          },
          {
            key: 'flow',
            label: '流程图',
            children: (
              <div className="demo-drawer-body">
                {doc?.flow ? (
                  <div className="demo-drawer-flow-content">
                    <img src={doc.flow} alt="流程图" style={{ width: '100%' }} />
                  </div>
                ) : (
                  <div className="demo-drawer-empty">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔀</div>
                    <div>暂无关联流程图</div>
                  </div>
                )}
              </div>
            ),
          },
        ]}
        style={{ paddingLeft: 20, paddingRight: 20 }}
      />
    </Drawer>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/demo/DocDrawer.jsx
git commit -m "feat(demo): add DocDrawer component"
```

---

### Task 5: 创建 DemoToggle 组件

**Files:**
- Create: `src/demo/DemoToggle.jsx`

- [ ] **Step 1: 创建 DemoToggle 组件**

右上角固定按钮：开关 + 版本筛选标签。

```jsx
// src/demo/DemoToggle.jsx
import { Switch, Tag } from 'antd';
import { useDemo } from './DemoProvider';
import { iterations } from './iterations';

export default function DemoToggle() {
  const { demoMode, activeVersion, toggleDemo, filterVersion } = useDemo();

  return (
    <div className="demo-toggle-bar">
      <div className="demo-toggle-left">
        <Switch
          size="small"
          checked={demoMode}
          onChange={toggleDemo}
        />
        <span className="demo-toggle-label">
          {demoMode ? '演示模式' : '纯净模式'}
        </span>
        {demoMode && (
          <>
            <span className="demo-toggle-divider" />
            <span className="demo-toggle-filter-label">筛选版本：</span>
            <div className="demo-version-tags">
              <Tag
                className={`demo-version-tag ${activeVersion === 'all' ? 'demo-version-active' : ''}`}
                onClick={() => filterVersion('all')}
              >
                全部
              </Tag>
              {iterations.versions.map(v => (
                <Tag
                  key={v.key}
                  className={`demo-version-tag ${activeVersion === v.key ? 'demo-version-active' : ''}`}
                  onClick={() => filterVersion(v.key)}
                >
                  {v.label} ({v.date})
                </Tag>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/demo/DemoToggle.jsx
git commit -m "feat(demo): add DemoToggle component"
```

---

### Task 6: 添加 Demo CSS 样式

**Files:**
- Create: `src/demo/demo.css`
- Modify: `src/App.jsx` (import demo.css)

- [ ] **Step 1: 创建 demo.css**

```css
/* src/demo/demo.css */

/* 开关栏 */
.demo-toggle-bar {
  position: fixed;
  top: 0;
  right: 200px;
  z-index: 999;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 6px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
}
.demo-toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.demo-toggle-label {
  font-size: 12px;
  color: #333;
  white-space: nowrap;
}
.demo-toggle-divider {
  width: 1px;
  height: 16px;
  background: #e8e8e8;
}
.demo-toggle-filter-label {
  font-size: 12px;
  color: #999;
}
.demo-version-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.demo-version-tag {
  cursor: pointer;
  border-radius: 10px;
  font-size: 11px;
  padding: 0 8px;
  margin: 0;
  transition: all 0.2s;
  user-select: none;
}
.demo-version-tag:hover {
  border-color: #1890ff;
  color: #1890ff;
}
.demo-version-active {
  background: #1890ff !important;
  color: #fff !important;
  border-color: #1890ff !important;
}

/* 区域级标记 */
.demo-iteration-mark {
  position: relative;
  border: 2px dashed transparent;
  border-radius: 8px;
  transition: all 0.3s;
  padding: 16px;
  margin: -16px;
}
.demo-iteration-mark.demo-hover {
  border-color: #91d5ff;
  background: rgba(240, 248, 255, 0.5);
}
.demo-iteration-mark.demo-dimmed {
  opacity: 0.2;
  pointer-events: none;
}
.demo-iteration-badges {
  position: absolute;
  top: -12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}
.demo-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.demo-badge:hover {
  transform: scale(1.08);
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
.demo-badge-version {
  background: #1890ff;
  color: #fff;
}
.demo-badge-link {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}
.demo-badge-flow {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}
.demo-iteration-content {
  /* transparent wrapper */
}

/* 字段级标记 */
.demo-field-mark {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.demo-field-mark.demo-dimmed {
  opacity: 0.2;
}
.demo-field-tag {
  display: inline-flex;
  font-size: 10px;
  color: #1890ff;
  cursor: pointer;
  padding: 0 4px;
  border-radius: 8px;
  white-space: nowrap;
  transition: all 0.2s;
}
.demo-field-tag:hover {
  color: #40a9ff;
  background: #f0f5ff;
}
.demo-field-wrap {
  display: inline-block;
  transition: all 0.2s;
  border-radius: 4px;
}
.demo-field-wrap.demo-field-new {
  border: 1px solid #91d5ff;
  background: #f0f8ff;
}
.demo-field-wrap.demo-field-modified {
  border: 1px solid #ffd591;
  background: #fffbe6;
}
.demo-field-wrap.demo-field-optimized {
  border: 1px solid #d3adf7;
  background: #f9f0ff;
}
.demo-field-wrap.demo-dimmed {
  opacity: 0.2;
}

/* 抽屉 */
.demo-drawer-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.demo-drawer-title {
  font-size: 16px;
  font-weight: 600;
}
.demo-drawer-close {
  color: #999;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
}
.demo-drawer-close:hover {
  color: #333;
}
.demo-drawer-body {
  padding: 20px;
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}
.demo-drawer-empty {
  text-align: center;
  padding: 40px 0;
  color: #999;
}
.demo-drawer-doc-content code {
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/demo/demo.css
git commit -m "feat(demo): add demo CSS styles"
```

---

### Task 7: 接入 main.jsx 和 App.jsx

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: 修改 main.jsx，用 DemoProvider 包裹 App**

```jsx
// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DemoProvider } from './demo/DemoProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DemoProvider>
      <App />
    </DemoProvider>
  </StrictMode>,
)
```

- [ ] **Step 2: 在 App.jsx 顶部添加 import**

在 App.jsx 文件顶部（约 line 1-24 附近）添加以下 import：

```jsx
import DemoToggle from './demo/DemoToggle';
import DocDrawer from './demo/DocDrawer';
import IterationMark from './demo/IterationMark';
import { FieldMark, FieldWrap } from './demo/FieldMark';
import './demo/demo.css';
```

- [ ] **Step 3: 在 App.jsx return 的 Layout 闭合标签前添加 DemoToggle 和 DocDrawer**

找到 App.jsx 中 `<Layout>` 结束标签之前的位置（约 line 1033 附近），在 Layout 闭合前添加：

```jsx
      </Layout>
      <DemoToggle />
      <DocDrawer />
```

- [ ] **Step 4: 提交**

```bash
git add src/main.jsx src/App.jsx
git commit -m "feat(demo): wire DemoProvider, DemoToggle, DocDrawer into app"
```

---

### Task 8: 给收入核算页添加标记

**Files:**
- Modify: `src/App.jsx` (revenue page sections, lines 468-844)

收入核算页 (`selectedMenu === 'revenue'`) 需要标记以下内容：

| 位置 | 版本 | 类型 | 标签 | 行号范围 |
|------|------|------|------|----------|
| 筛选条件 Row 1 | 2.0 | new | 筛选条件区域 | 472-518 |
| 筛选条件 Row 2 | 2.0 | new | 筛选条件扩展 | 520-545 |
| 收入类型扩展到5种 | 2.1 | modified | 收入类型扩展 | 638-671 (统计卡片) |
| 订单列表+详情面板 | 2.1 | new | 收入核算页 | 549-841 |

- [ ] **Step 1: 用 IterationMark 包裹筛选条件 Row 1（约 line 472-518）**

将筛选 Row 1 区域用 `<IterationMark>` 包裹：

```jsx
<IterationMark version="2.0" date="04-22" type="new" label="筛选条件区域">
  {/* 原 Row 1 筛选条件代码（team, teamRegion 等筛选输入框） */}
</IterationMark>
```

- [ ] **Step 2: 用 IterationMark 包裹订单列表 + 详情面板整体（约 line 549-841）**

```jsx
<IterationMark version="2.1" date="04-23" type="new" label="收入核算页（列表+详情）">
  {/* 原 order list + order detail panel 代码 */}
</IterationMark>
```

- [ ] **Step 3: 提交**

```bash
git add src/App.jsx
git commit -m "feat(demo): add iteration marks to revenue page"
```

---

### Task 9: 给订单核算管理页添加标记

**Files:**
- Modify: `src/App.jsx` (order-accounting sections, lines 847-1014)

订单核算管理页需标记：

| 位置 | 版本 | 类型 | 标签 |
|------|------|------|------|
| 待确认收入列 | 2.5 | new | 待确认收入列 |
| 业务收入1/2拆分列 | 2.5 | modified | 业务收入拆分 |
| 列筛选优化 | 2.5 | optimized | 列筛选交互 |

- [ ] **Step 1: 用 FieldMark 标记统计卡片中的待确认收入（约 line 850-891）**

在待确认收入 Statistic 组件外层用 FieldWrap 包裹：

```jsx
<FieldWrap version="2.5" type="new">
  <Card><Statistic title="待确认收入" ... /></Card>
</FieldWrap>
```

- [ ] **Step 2: 用 IterationMark 包裹整个订单核算表格区（约 line 980-1012）**

```jsx
<IterationMark version="2.5" date="04-25" type="modified" label="订单核算表格（列拆分+筛选优化）">
  {/* 原 order accounting table 代码 */}
</IterationMark>
```

- [ ] **Step 3: 提交**

```bash
git add src/App.jsx
git commit -m "feat(demo): add iteration marks to order-accounting page"
```

---

### Task 10: 给 OrderDetailPage 添加标记

**Files:**
- Modify: `src/OrderDetailPage.jsx`

订单详情页需标记：

| 位置 | 版本 | 类型 | 标签 | 行号范围 |
|------|------|------|------|----------|
| 整体分栏布局 | 2.1 | modified | 分栏布局重构 | 176-527 |
| 收入确认概览卡片 | 2.0 | new | 收入确认概览 | 253-316 |
| 收入核算明细 Tab | 2.0 | new | 收入核算明细 | 322-380 |
| 规则快照 Tab | 2.0 | new | 规则快照 | 382-437 |

- [ ] **Step 1: 在文件顶部添加 import**

```jsx
import IterationMark from './demo/IterationMark';
```

- [ ] **Step 2: 用 IterationMark 包裹分栏布局整体**

在 `<div style={{ display: 'flex' }}>` 的外层（约 line 176）：

```jsx
<IterationMark version="2.1" date="04-23" type="modified" label="订单详情 — 分栏布局">
  <div style={{ display: 'flex', ... }}>
    ...
  </div>
</IterationMark>
```

- [ ] **Step 3: 用 IterationMark 包裹收入确认概览卡片（约 line 253）**

```jsx
<IterationMark version="2.0" date="04-22" type="new" label="收入确认概览">
  {/* 原 revenue summary card 代码 */}
</IterationMark>
```

- [ ] **Step 4: 用 IterationMark 包裹收入核算明细 Tab 内容**

```jsx
<IterationMark version="2.0" date="04-22" type="new" label="收入核算明细">
  {/* 原 revenue detail table 代码 */}
</IterationMark>
```

- [ ] **Step 5: 用 IterationMark 包裹规则快照 Tab 内容**

```jsx
<IterationMark version="2.0" date="04-22" type="new" label="规则快照">
  {/* 原 rule snapshot timeline 代码 */}
</IterationMark>
```

- [ ] **Step 6: 提交**

```bash
git add src/OrderDetailPage.jsx
git commit -m "feat(demo): add iteration marks to OrderDetailPage"
```

---

### Task 11: 给 AdjustmentPage 添加标记

**Files:**
- Modify: `src/AdjustmentPage.jsx`

调整单列表页标记：

| 位置 | 版本 | 类型 | 标签 |
|------|------|------|------|
| 整页 | 2.1 | new | 调整单列表页 |

- [ ] **Step 1: 在文件顶部添加 import**

```jsx
import IterationMark from './demo/IterationMark';
```

- [ ] **Step 2: 用 IterationMark 包裹整个页面返回内容**

在 return 的最外层 `<div>` 内，用 IterationMark 包裹全部内容：

```jsx
return (
  <div className="adj-page">
    <IterationMark version="2.1" date="04-23" type="new" label="调整单列表页">
      {/* 原全部内容 */}
    </IterationMark>
  </div>
);
```

- [ ] **Step 3: 提交**

```bash
git add src/AdjustmentPage.jsx
git commit -m "feat(demo): add iteration marks to AdjustmentPage"
```

---

### Task 12: 迁移 AdjustmentFormPage 现有高亮系统

**Files:**
- Modify: `src/AdjustmentFormPage.jsx`

当前 AdjustmentFormPage 已有一套迭代高亮系统（lines 80-115，CSS 在 App.css lines 559-705）。需要迁移到新的 DemoProvider 体系。

- [ ] **Step 1: 在文件顶部添加 import**

```jsx
import IterationMark from './demo/IterationMark';
import { FieldMark } from './demo/FieldMark';
```

- [ ] **Step 2: 移除旧的 iteration 代码（约 line 80-115）**

删除以下代码块：
- `iterationChanges` 数组定义
- `selectedIteration` / `selectedIterationInfo` state
- `isIterationHighlighted()` / `getIterationHighlightClass()` 函数

- [ ] **Step 3: 移除旧的迭代触发按钮 Popover（约 line 900-953 中的触发按钮部分）**

删除顶栏中的「迭代变更」Popover 按钮及其相关代码。

- [ ] **Step 4: 用新 IterationMark 替换旧的 className 标记**

将 `className={getIterationHighlightClass('orderRule')}` 替换为 `<IterationMark>` 包裹：

```jsx
<IterationMark version="2.4" date="04-24" type="new" label="订单规则模块" docKey="adjustment-order-rule">
  {/* 原 order rule block 代码 */}
</IterationMark>
```

将 `className={getIterationHighlightClass('adjustmentItems')}` 替换为 FieldMark：

```jsx
{/* 在调整项目 Form.Item 的 label 属性中使用 FieldMark */}
<Form.Item label={<FieldMark version="2.5" date="04-25" type="modified">调整项目</FieldMark>} ...>
```

- [ ] **Step 5: 提交**

```bash
git add src/AdjustmentFormPage.jsx
git commit -m "feat(demo): migrate AdjustmentFormPage to new iteration mark system"
```

---

### Task 13: 清理旧 CSS

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: 移除旧的迭代高亮 CSS（约 line 559-705）**

删除以下 CSS 类：
- `.af-iteration-trigger` 及相关 Popover 样式
- `.af-iteration-highlight` 及 `-orderRule` / `-adjustmentItems` 变体
- `.af-iteration-field-tag` / `.af-iteration-section-tag`

这些样式已被 `src/demo/demo.css` 中的新样式替代。

- [ ] **Step 2: 提交**

```bash
git add src/App.css
git commit -m "refactor(demo): remove old iteration highlight CSS"
```

---

### Task 14: 更新 CHANGELOG

**Files:**
- Modify: `版本管理/CHANGELOG.md`

- [ ] **Step 1: 在 CHANGELOG.md 的 [Unreleased] 区段添加变更记录**

在 `## [Unreleased]` 的 `### 新增` 部分添加：

```markdown
- `src/demo/` — 新增迭代标记演示系统，包含 DemoProvider、IterationMark、FieldMark、DocDrawer、DemoToggle 组件
- `src/demo/iterations.js` — 迭代版本和文档配置
- `src/main.jsx` — 接入 DemoProvider 包裹
- `src/App.jsx` — 收入核算页和订单核算管理页添加迭代标记
- `src/OrderDetailPage.jsx` — 订单详情页添加迭代标记
- `src/AdjustmentPage.jsx` — 调整单列表页添加迭代标记
- `src/AdjustmentFormPage.jsx` — 迁移到新的迭代标记系统
```

在 `### 修改` 部分添加：

```markdown
- `src/AdjustmentFormPage.jsx` + `src/App.css` — 移除旧的迭代高亮代码，迁移到新的 demo 标记体系
```

- [ ] **Step 2: 提交**

```bash
git add "版本管理/CHANGELOG.md"
git commit -m "docs: update CHANGELOG for iteration marking system"
```

---

### Task 15: 构建验证 + 部署

**Files:**
- None (build + deploy)

- [ ] **Step 1: 本地构建验证**

```bash
cd "D:/wzz/wzz/Revenue/开发代码/accounting-demo"
npm run build
```

预期：构建成功，无错误。

- [ ] **Step 2: 本地预览验证**

```bash
npm run preview
```

打开浏览器检查：
1. 默认演示模式：标记可见，开关可点击，版本筛选生效，抽屉可打开
2. 关闭开关：所有标记消失，页面恢复纯净
3. 各页面标记位置正确（收入核算、订单核算管理、订单详情、调整单列表、调整单表单）

- [ ] **Step 3: 部署到 GitHub Pages**

```bash
npx gh-pages -d dist
```
