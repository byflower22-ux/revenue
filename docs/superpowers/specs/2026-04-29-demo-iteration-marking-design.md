# 迭代标记系统设计文档

## 背景

本项目作为产品经理向研发测试团队的交付物，需要在页面上标记每个迭代新增或修改的功能，并关联对应的需求文档和流程图。同时要求标记层不影响原始业务代码，纯净版页面可直接交付前端使用。

## 需求

1. 页面右上角开关按钮，切换「演示模式」和「纯净模式」
2. 整块区域新增时标记区域，局部字段变动时标记字段
3. 点击标记可弹出侧边抽屉，展示 PRD 文档和流程图
4. 支持按迭代版本号筛选标记，未匹配的标记变淡
5. 版本格式：`2.0迭代 (04-22)` 混合格式
6. 原始业务代码零修改，交付时移除 demo 目录即可

## 架构

### 文件结构

```
src/
  App.jsx                      ← 原始代码（不修改）
  OrderDetailPage.jsx          ← 原始代码（不修改）
  AdjustmentPage.jsx           ← 原始代码（不修改）
  AdjustmentFormPage.jsx       ← 原始代码（不修改）
  mockData.js                  ← 原始代码（不修改）
  main.jsx                     ← 仅添加 DemoProvider 包裹
  demo/                        ← 演示标记层（独立目录）
    DemoProvider.jsx           ← 开关状态 Context
    DemoToggle.jsx             ← 右上角开关按钮 + 版本筛选器
    IterationMark.jsx          ← 区域级标记包裹组件
    FieldMark.jsx              ← 字段级标记组件
    DocDrawer.jsx              ← 侧边抽屉（PRD + 流程图）
    iterations.js              ← 迭代标记配置数据
    docs/                      ← 文档资源
      prd/                     ← PRD 文档 HTML 片段
      flows/                   ← 流程图图片
```

### 切换机制

- `DemoProvider` 通过 React Context 提供 `demoMode` 状态（boolean）
- `DemoToggle` 在右上角渲染开关按钮和版本筛选标签
- **演示模式 ON**：IterationMark 渲染徽章 + 交互；FieldMark 渲染字段标签
- **演示模式 OFF**：IterationMark 仅渲染 children；FieldMark 仅渲染 children；DemoToggle 不渲染
- 交付前端时：从 main.jsx 移除 DemoProvider 包裹，删除 `src/demo/` 目录

### 唯一入口点

原始代码只需一处改动：`main.jsx` 中用 `DemoProvider` 包裹 `<App />`。

```jsx
// main.jsx
import { DemoProvider } from './demo/DemoProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <DemoProvider>
    <App />
  </DemoProvider>
);
```

## 组件设计

### DemoProvider

- React Context Provider，管理 `demoMode`（boolean）和 `activeVersions`（Set）
- 默认 `demoMode = true`，`activeVersions = 'all'`
- 提供 `toggleDemo()` 和 `filterVersion(version)` 方法

### DemoToggle

- 消费 DemoProvider Context
- 渲染：开关按钮 + 版本筛选标签（全部 / 各迭代版本号）
- 右上角固定定位
- 仅在 `demoMode` 可用时渲染，纯净模式下也不显示（通过检测 URL 参数或 localStorage 控制）

### IterationMark（区域级）

Props：
- `version`：版本号，如 `'2.0'`
- `date`：日期，如 `'04-22'`
- `type`：变更类型，`'new'` | `'modified'` | `'optimized'`
- `label`：标记描述，如 `'筛选条件区域'`
- `docKey`：关联文档 key，对应 iterations.js 中的文档配置

行为：
- demoMode ON + 版本匹配：渲染蓝色虚线边框 + 顶部徽章组（版本号、类型标签、PRD链接、流程图链接）
- demoMode OFF 或 版本不匹配（dimmed）：仅渲染 children，不添加任何 DOM
- 点击徽章打开 DocDrawer
- hover 时边框变实线 + 浅蓝背景

### FieldMark（字段级）

Props：
- `version`：版本号
- `date`：日期
- `type`：变更类型
- `docKey`：关联文档 key

行为：
- demoMode ON + 版本匹配：在 children 旁渲染小标签（如 `✨ 2.5新增`），children 获得对应样式（新字段蓝框蓝底，修改字段橙框黄底）
- demoMode OFF 或 dimmed：仅渲染 children，不添加任何样式

### DocDrawer（侧边抽屉）

- 使用 Ant Design Drawer 组件
- 顶部：标题 + 版本徽章 + 类型徽章 + 关闭按钮
- Tab 栏：「需求文档」「流程图」
- 需求文档 Tab：渲染对应的 PRD 内容（HTML 片段或 Markdown）
- 流程图 Tab：展示对应的流程图图片
- 文档内容通过 `docKey` 从 iterations.js 配置中获取

### iterations.js（配置数据）

```js
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
      prd: '/demo/docs/prd/adjustment-order-rule.html',
      flow: '/demo/docs/flows/adjustment-order-rule.png',
    },
    // ... 更多文档映射
  },
};
```

## 标记方案

根据 CHANGELOG 记录，各页面标记如下：

### 收入核算页（App.jsx revenue 部分）

| 位置 | 版本 | 类型 | 标签 | 文档 |
|------|------|------|------|------|
| 筛选条件区域 | 2.0 | new | 筛选条件区域 | - |
| 团队字段 | 2.0 | new | 团队 | - |
| 区域字段 | 2.0 | new | 区域 | - |
| 订单列表+详情面板 | 2.1 | new | 收入核算页 | - |
| 收入类型扩展（4→5） | 2.1 | modified | 收入类型 | - |

### 订单核算管理页（App.jsx order-accounting 部分）

| 位置 | 版本 | 类型 | 标签 | 文档 |
|------|------|------|------|------|
| 业务收入1比例列 | 2.5 | new | 业务收入1比例 | - |
| 业务收入2比例列 | 2.5 | new | 业务收入2比例 | - |
| 待确认收入列 | 2.5 | new | 待确认收入 | order-list-optimization |
| 订单类型列筛选 | 2.5 | optimized | 列筛选 | order-list-optimization |
| 状态列筛选 | 2.5 | optimized | 列筛选 | order-list-optimization |

### 订单详情页（OrderDetailPage.jsx）

| 位置 | 版本 | 类型 | 标签 | 文档 |
|------|------|------|------|------|
| 整体分栏布局 | 2.1 | modified | 分栏布局重构 | - |
| 收入确认概览卡片 | 2.0 | new | 收入确认概览 | - |
| 收入核算明细Tab | 2.0 | new | 收入核算明细 | - |
| 规则快照Tab | 2.0 | new | 规则快照 | - |

### 调整单列表页（AdjustmentPage.jsx）

| 位置 | 版本 | 类型 | 标签 | 文档 |
|------|------|------|------|------|
| 整页 | 2.1 | new | 调整单列表页 | - |

### 调整单创建页（AdjustmentFormPage.jsx）

| 位置 | 版本 | 类型 | 标签 | 文档 |
|------|------|------|------|------|
| 多订单选择 | 2.4 | new | 多订单选择 | - |
| 订单规则展示/编辑 | 2.4 | new | 订单规则模块 | adjustment-order-rule |
| 调整项联动业务模块 | 2.5 | new | 业务模块联动 | adj-module-linkage |
| 调整项联动交付模块 | 2.5 | new | 交付模块联动 | adj-module-linkage |
| 项目下拉联动规则 | 2.5 | new | 项目下拉联动 | adj-module-linkage |

## 交付方式

1. 交付前端时：
   - 从 `main.jsx` 移除 `DemoProvider` 包裹
   - 删除 `src/demo/` 整个目录
   - 原始页面组件代码无任何改动

2. 交付产品演示时：
   - 保持 DemoProvider 包裹
   - 构建后部署即可展示带标记的版本
