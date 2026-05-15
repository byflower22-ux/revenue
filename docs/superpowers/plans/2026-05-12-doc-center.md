# 文档中心页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在演示模式下新增"文档中心"功能，通过顶部导航栏入口打开新页签，按迭代版本汇总展示需求文档和流程图。

**Architecture:** 独立 HTML 页面（`public/doc-center.html`），纯 JS 渲染，不依赖 React。通过 `doc-manifest.json` 配置文件管理文档与迭代的映射关系。需求文档用 marked 库渲染 markdown 并提取目录，流程图直接展示图片。

**Tech Stack:** HTML/CSS/JS, marked (CDN), Vite public 目录静态资源

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `public/doc-manifest.json` | Create | 文档清单配置，按迭代列出需求文档和流程图 |
| `public/docs/需求文档-V2.5-调整单订单规则.md` | Create | V2.5 迭代需求文档（复制自项目根目录并重命名） |
| `public/flows/流程图-V2.5-订单规则初始化流程.png` | Create | V2.5 迭代流程图（复制并重命名） |
| `public/flows/流程图-V2.5-收入生成主流程.png` | Create | V2.5 迭代流程图（复制并重命名） |
| `public/doc-center.html` | Create | 文档中心独立页面 |
| `src/App.jsx` | Modify (lines 506-509) | 顶部导航栏增加"文档中心"按钮 |

---

### Task 1: 准备文档资源文件

**Files:**
- Create: `public/docs/需求文档-V2.5-调整单订单规则.md`
- Create: `public/flows/流程图-V2.5-订单规则初始化流程.png`
- Create: `public/flows/流程图-V2.5-收入生成主流程.png`

- [ ] **Step 1: 复制需求文档到 public/docs/ 并按命名规范重命名**

将 `D:\wzz\wzz\Revenue\需求文档\2026-04-25-adjustment-order-rules-prd.md` 复制到 `public/docs/需求文档-V2.5-调整单订单规则.md`。

```bash
cp "D:\wzz\wzz\Revenue\需求文档\2026-04-25-adjustment-order-rules-prd.md" "D:\wzz\wzz\Revenue\开发代码\accounting-demo\public\docs\需求文档-V2.5-调整单订单规则.md"
```

- [ ] **Step 2: 复制流程图到 public/flows/ 并按命名规范重命名**

```bash
cp "D:\wzz\wzz\Revenue\流程图\订单规则初始化流程.png" "D:\wzz\wzz\Revenue\开发代码\accounting-demo\public\flows\流程图-V2.5-订单规则初始化流程.png"
cp "D:\wzz\wzz\Revenue\流程图\收入生成主流程.png" "D:\wzz\wzz\Revenue\开发代码\accounting-demo\public\flows\流程图-V2.5-收入生成主流程.png"
```

- [ ] **Step 3: 提交**

```bash
cd "D:\wzz\wzz\Revenue\开发代码\accounting-demo"
git add public/docs/需求文档-V2.5-调整单订单规则.md public/flows/流程图-V2.5-订单规则初始化流程.png public/flows/流程图-V2.5-收入生成主流程.png
git commit -m "chore: add doc center resource files with iteration naming"
```

---

### Task 2: 创建文档清单配置

**Files:**
- Create: `public/doc-manifest.json`

- [ ] **Step 1: 创建 doc-manifest.json**

路径：`D:\wzz\wzz\Revenue\开发代码\accounting-demo\public\doc-manifest.json`

```json
{
  "versions": [
    {
      "key": "2.5",
      "label": "V2.5 迭代",
      "date": "04-25",
      "docs": [
        {
          "title": "调整单 — 订单规则模块 PRD",
          "file": "docs/需求文档-V2.5-调整单订单规则.md"
        }
      ],
      "flows": [
        {
          "title": "订单规则初始化流程",
          "file": "flows/流程图-V2.5-订单规则初始化流程.png"
        },
        {
          "title": "收入生成主流程",
          "file": "flows/流程图-V2.5-收入生成主流程.png"
        }
      ]
    }
  ]
}
```

注意：`file` 路径相对于 Vite 的 base 路径（`/revenue/`），实际 fetch URL 为 `/revenue/{file}`。

- [ ] **Step 2: 提交**

```bash
cd "D:\wzz\wzz\Revenue\开发代码\accounting-demo"
git add public/doc-manifest.json
git commit -m "feat: add doc-manifest.json for doc center"
```

---

### Task 3: 创建文档中心页面

**Files:**
- Create: `public/doc-center.html`

这是最核心的任务。创建完整的独立 HTML 页面。

- [ ] **Step 1: 创建 doc-center.html**

路径：`D:\wzz\wzz\Revenue\开发代码\accounting-demo\public\doc-center.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>文档中心 - 财务分润系统</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f0f2f5; color: #333; height: 100vh; overflow: hidden; }

    /* === Layout === */
    .layout { display: flex; height: 100vh; }

    /* Left Panel - Iteration List */
    .left-panel {
      width: 180px; background: #fff; border-right: 1px solid #e8e8e8;
      display: flex; flex-direction: column; flex-shrink: 0;
    }
    .left-panel-header {
      padding: 16px; border-bottom: 1px solid #f0f0f0;
      font-weight: 600; font-size: 14px; color: #1890ff;
    }
    .version-list { flex: 1; overflow-y: auto; padding: 8px; }
    .version-item {
      padding: 10px 12px; border-radius: 6px; margin-bottom: 4px;
      cursor: pointer; transition: all 0.2s;
    }
    .version-item:hover { background: #f5f5f5; }
    .version-item.active {
      background: #e6f7ff; border-left: 3px solid #1890ff;
    }
    .version-item .label { font-weight: 500; font-size: 14px; }
    .version-item .date { font-size: 12px; color: #999; margin-top: 2px; }
    .version-item.active .label { color: #1890ff; }

    /* Main Area */
    .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    /* Top Tabs */
    .top-tabs {
      display: flex; background: #fff; border-bottom: 1px solid #e8e8e8; padding: 0 16px;
    }
    .top-tab {
      padding: 12px 24px; font-size: 14px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s; color: #666;
    }
    .top-tab:hover { color: #1890ff; }
    .top-tab.active { color: #1890ff; border-bottom-color: #1890ff; font-weight: 500; }

    /* Content Area */
    .content-area { flex: 1; display: flex; background: #fff; overflow: hidden; }

    /* Middle Panel - TOC / Flow list */
    .middle-panel {
      width: 220px; border-right: 1px solid #e8e8e8;
      display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
    }
    .middle-panel-header {
      padding: 14px 16px; font-weight: 600; font-size: 13px;
      border-bottom: 1px solid #f0f0f0; color: #333;
    }
    .toc-list { flex: 1; overflow-y: auto; padding: 8px; }
    .toc-item {
      padding: 6px 10px; border-radius: 4px; margin-bottom: 2px;
      font-size: 13px; cursor: pointer; transition: all 0.15s;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .toc-item:hover { background: #f5f5f5; }
    .toc-item.active { background: #e6f7ff; color: #1890ff; }
    .toc-item[data-level="2"] { padding-left: 10px; }
    .toc-item[data-level="3"] { padding-left: 20px; font-size: 12px; color: #888; }
    .toc-item[data-level="4"] { padding-left: 30px; font-size: 12px; color: #aaa; }

    .flow-item {
      padding: 10px 14px; border-radius: 6px; margin-bottom: 4px;
      cursor: pointer; transition: all 0.15s; font-size: 13px;
    }
    .flow-item:hover { background: #f5f5f5; }
    .flow-item.active { background: #f3e8ff; border-left: 3px solid #722ed1; color: #722ed1; font-weight: 500; }

    /* Right Panel - Content Preview */
    .right-panel { flex: 1; overflow-y: auto; min-width: 0; }

    /* Markdown Content */
    .doc-content { padding: 24px 32px; line-height: 1.8; }
    .doc-content h1 { font-size: 22px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e8e8e8; }
    .doc-content h2 { font-size: 18px; margin: 24px 0 12px 0; color: #1890ff; }
    .doc-content h3 { font-size: 15px; margin: 20px 0 10px 0; }
    .doc-content h4 { font-size: 14px; margin: 16px 0 8px 0; color: #666; }
    .doc-content p { margin: 0 0 12px 0; }
    .doc-content ul, .doc-content ol { margin: 0 0 12px 0; padding-left: 24px; }
    .doc-content li { margin-bottom: 4px; }
    .doc-content code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    .doc-content pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0 0 12px 0; }
    .doc-content table { width: 100%; border-collapse: collapse; margin: 0 0 12px 0; }
    .doc-content th, .doc-content td { border: 1px solid #e8e8e8; padding: 8px 12px; text-align: left; }
    .doc-content th { background: #fafafa; font-weight: 500; }
    .doc-content blockquote { border-left: 3px solid #1890ff; padding: 4px 12px; background: #f0f7ff; margin: 0 0 12px 0; }

    /* Flow Preview */
    .flow-preview { padding: 20px; display: flex; flex-direction: column; align-items: center; height: 100%; }
    .flow-preview img { max-width: 100%; border-radius: 6px; border: 1px solid #f0f0f0; transition: transform 0.2s; }
    .flow-toolbar { margin-top: 12px; display: flex; gap: 12px; align-items: center; }
    .flow-toolbar button {
      padding: 4px 12px; border: 1px solid #d9d9d9; border-radius: 4px;
      background: #fff; cursor: pointer; font-size: 13px; color: #555;
    }
    .flow-toolbar button:hover { color: #1890ff; border-color: #1890ff; }
    .flow-toolbar .zoom-label { font-size: 13px; color: #999; min-width: 40px; text-align: center; }

    /* Empty State */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: #bbb; font-size: 14px;
    }
    .empty-state .icon { font-size: 48px; margin-bottom: 12px; }

    /* Loading */
    .loading { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; }
  </style>
</head>
<body>
  <div class="layout">
    <!-- Left Panel: Iteration List -->
    <div class="left-panel">
      <div class="left-panel-header">迭代版本</div>
      <div class="version-list" id="versionList"></div>
    </div>

    <!-- Main Area -->
    <div class="main-area">
      <!-- Top Tabs -->
      <div class="top-tabs">
        <div class="top-tab active" data-tab="doc" onclick="switchTab('doc')">需求文档</div>
        <div class="top-tab" data-tab="flow" onclick="switchTab('flow')">流程图</div>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <!-- Middle Panel: TOC / Flow List -->
        <div class="middle-panel" id="middlePanel"></div>
        <!-- Right Panel: Content -->
        <div class="right-panel" id="rightPanel"></div>
      </div>
    </div>
  </div>

  <script>
    // === State ===
    let manifest = null;
    let activeVersionKey = null;
    let activeTab = 'doc';
    let activeTocIndex = 0;
    let activeFlowIndex = 0;
    let flowZoom = 100;
    let tocItems = [];

    // === Init ===
    async function init() {
      const basePath = getBasePath();
      const res = await fetch(basePath + 'doc-manifest.json');
      manifest = await res.json();
      if (manifest.versions.length > 0) {
        activeVersionKey = manifest.versions[0].key;
      }
      renderVersionList();
      renderContent();
    }

    function getBasePath() {
      const path = window.location.pathname;
      const idx = path.lastIndexOf('/');
      return path.substring(0, idx + 1);
    }

    // === Render Version List ===
    function renderVersionList() {
      const container = document.getElementById('versionList');
      container.innerHTML = manifest.versions.map(v => `
        <div class="version-item ${v.key === activeVersionKey ? 'active' : ''}"
             onclick="selectVersion('${v.key}')">
          <div class="label">${v.label}</div>
          <div class="date">${v.date}</div>
        </div>
      `).join('');
    }

    function selectVersion(key) {
      activeVersionKey = key;
      activeTocIndex = 0;
      activeFlowIndex = 0;
      flowZoom = 100;
      renderVersionList();
      renderContent();
    }

    // === Switch Tab ===
    function switchTab(tab) {
      activeTab = tab;
      activeTocIndex = 0;
      activeFlowIndex = 0;
      flowZoom = 100;
      document.querySelectorAll('.top-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === tab);
      });
      renderContent();
    }

    // === Get Active Version ===
    function getActiveVersion() {
      return manifest.versions.find(v => v.key === activeVersionKey);
    }

    // === Render Content ===
    function renderContent() {
      const version = getActiveVersion();
      if (!version) return;
      if (activeTab === 'doc') {
        renderDocTab(version);
      } else {
        renderFlowTab(version);
      }
    }

    // === Doc Tab ===
    async function renderDocTab(version) {
      const middlePanel = document.getElementById('middlePanel');
      const rightPanel = document.getElementById('rightPanel');

      if (!version.docs || version.docs.length === 0) {
        middlePanel.innerHTML = '<div class="middle-panel-header">目录</div><div class="empty-state"><div class="icon">📄</div><div>暂无目录</div></div>';
        rightPanel.innerHTML = '<div class="empty-state"><div class="icon">📄</div><div>该迭代暂无需求文档</div></div>';
        return;
      }

      rightPanel.innerHTML = '<div class="loading">加载中...</div>';

      const doc = version.docs[0];
      const basePath = getBasePath();
      const res = await fetch(basePath + doc.file);
      const mdText = await res.text();

      // Parse TOC from markdown headings
      tocItems = [];
      const headingRegex = /^(#{1,4})\s+(.+)$/gm;
      let match;
      while ((match = headingRegex.exec(mdText)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        tocItems.push({ level, text, id: 'heading-' + tocItems.length });
      }

      // Render TOC
      if (tocItems.length > 0) {
        middlePanel.innerHTML = `
          <div class="middle-panel-header">目录</div>
          <div class="toc-list">
            ${tocItems.map((item, idx) => `
              <div class="toc-item ${idx === activeTocIndex ? 'active' : ''}"
                   data-level="${item.level}"
                   onclick="scrollToHeading(${idx})">
                ${item.text}
              </div>
            `).join('')}
          </div>
        `;
      } else {
        middlePanel.innerHTML = '<div class="middle-panel-header">目录</div><div class="empty-state"><div class="icon">📄</div><div>暂无目录</div></div>';
      }

      // Render markdown with heading IDs
      const renderer = new marked.Renderer();
      const origHeading = renderer.heading.bind(renderer);
      renderer.heading = function(data) {
        const idx = tocItems.findIndex(t => t.text === data.text && t.level === data.depth);
        const id = idx >= 0 ? tocItems[idx].id : '';
        return `<h${data.depth} id="${id}">${data.text}</h${data.depth}>\n`;
      };
      const html = marked.parse(mdText, { renderer });

      rightPanel.innerHTML = `<div class="doc-content">${html}</div>`;
    }

    function scrollToHeading(index) {
      activeTocIndex = index;
      const item = tocItems[index];
      const el = document.getElementById(item.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.toc-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
    }

    // === Flow Tab ===
    function renderFlowTab(version) {
      const middlePanel = document.getElementById('middlePanel');
      const rightPanel = document.getElementById('rightPanel');

      if (!version.flows || version.flows.length === 0) {
        middlePanel.innerHTML = '<div class="middle-panel-header">流程图列表</div><div class="empty-state"><div class="icon">🔀</div><div>暂无流程图</div></div>';
        rightPanel.innerHTML = '<div class="empty-state"><div class="icon">🔀</div><div>该迭代暂无流程图</div></div>';
        return;
      }

      middlePanel.innerHTML = `
        <div class="middle-panel-header">流程图列表</div>
        <div class="toc-list">
          ${version.flows.map((flow, idx) => `
            <div class="flow-item ${idx === activeFlowIndex ? 'active' : ''}"
                 onclick="selectFlow(${idx})">
              ${flow.title}
            </div>
          `).join('')}
        </div>
      `;

      renderFlowPreview(version);
    }

    function selectFlow(index) {
      activeFlowIndex = index;
      flowZoom = 100;
      const version = getActiveVersion();
      document.querySelectorAll('.flow-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      renderFlowPreview(version);
    }

    function renderFlowPreview(version) {
      const rightPanel = document.getElementById('rightPanel');
      const flow = version.flows[activeFlowIndex];
      if (!flow) return;

      const basePath = getBasePath();
      rightPanel.innerHTML = `
        <div class="flow-preview">
          <img id="flowImage" src="${basePath}${flow.file}" alt="${flow.title}"
               style="transform: scale(${flowZoom / 100}); transform-origin: top center;" />
          <div class="flow-toolbar">
            <button onclick="zoomFlow(-25)">缩小</button>
            <span class="zoom-label" id="zoomLabel">${flowZoom}%</span>
            <button onclick="zoomFlow(25)">放大</button>
            <button onclick="resetZoom()">重置</button>
            <button onclick="downloadFlow('${basePath}${flow.file}', '${flow.title}.png')">下载</button>
          </div>
        </div>
      `;

      // Mouse wheel zoom
      const img = document.getElementById('flowImage');
      img.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        zoomFlow(delta);
      }, { passive: false });
    }

    function zoomFlow(delta) {
      flowZoom = Math.max(25, Math.min(300, flowZoom + delta));
      const img = document.getElementById('flowImage');
      const label = document.getElementById('zoomLabel');
      if (img) img.style.transform = `scale(${flowZoom / 100})`;
      if (label) label.textContent = flowZoom + '%';
    }

    function resetZoom() {
      flowZoom = 100;
      const img = document.getElementById('flowImage');
      const label = document.getElementById('zoomLabel');
      if (img) img.style.transform = 'scale(1)';
      if (label) label.textContent = '100%';
    }

    function downloadFlow(url, filename) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    }

    // === Boot ===
    init();
  </script>
</body>
</html>
```

- [ ] **Step 2: 本地验证页面可以加载**

启动 dev server，在浏览器打开 `http://localhost:5173/revenue/doc-center.html`，确认：
- 左侧显示迭代列表
- 需求文档 Tab：中栏显示目录，右栏渲染 markdown
- 流程图 Tab：中栏显示列表，右栏显示图片
- 缩放、下载功能正常

- [ ] **Step 3: 提交**

```bash
cd "D:\wzz\wzz\Revenue\开发代码\accounting-demo"
git add public/doc-center.html
git commit -m "feat: add doc center standalone page"
```

---

### Task 4: 在 App.jsx 顶部导航栏添加入口

**Files:**
- Modify: `src/App.jsx` (lines 506-509, top-bar-right section)

- [ ] **Step 1: 在顶部导航栏添加"文档中心"按钮**

在 `src/App.jsx` 的 `top-bar-right` div 内（约第 506-509 行），在刷新按钮之前添加文档中心入口按钮。此按钮仅在 `demoMode` 为 true 时显示。

找到这段代码：

```jsx
<div className="top-bar-right">
  <Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined />} /></Tooltip>
  <Tooltip title="全屏"><Button type="text" icon={<DashboardOutlined />} /></Tooltip>
  <div className="top-bar-avatar">U</div>
```

替换为：

```jsx
<div className="top-bar-right">
  {demoMode && (
    <Tooltip title="文档中心">
      <Button
        type="text"
        icon={<FileTextOutlined />}
        onClick={() => {
          const base = import.meta.env.BASE_URL || '/';
          window.open(`${base}doc-center.html`.replace(/\/+/g, '/'), '_blank');
        }}
      />
    </Tooltip>
  )}
  <Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined />} /></Tooltip>
  <Tooltip title="全屏"><Button type="text" icon={<DashboardOutlined />} /></Tooltip>
  <div className="top-bar-avatar">U</div>
```

`FileTextOutlined` 已在文件顶部 import 中包含（第 10 行），无需额外引入。

- [ ] **Step 2: 验证入口按钮**

在浏览器打开 `http://localhost:5173/revenue/`，确认：
- 演示模式开启时，顶部导航栏右侧出现文档图标按钮
- 点击后新页签打开文档中心页面
- 关闭演示模式后按钮消失

- [ ] **Step 3: 提交**

```bash
cd "D:\wzz\wzz\Revenue\开发代码\accounting-demo"
git add src/App.jsx
git commit -m "feat: add doc center entry in top bar (demo mode only)"
```

---

### Task 5: 更新 CHANGELOG

**Files:**
- Modify: `版本管理/CHANGELOG.md`

- [ ] **Step 1: 在 CHANGELOG.md 的 [Unreleased] 区域添加条目**

在 `## [Unreleased]` 下的合适分类中添加：

```markdown
### Added
- 文档中心页面：演示模式下通过顶部导航栏入口打开，按迭代版本汇总展示需求文档和流程图
```

- [ ] **Step 2: 提交**

```bash
cd "D:\wzz\wzz\Revenue\开发代码\accounting-demo"
git add ../../版本管理/CHANGELOG.md
git commit -m "docs: update CHANGELOG for doc center feature"
```

---

## Plan Self-Review

**Spec coverage:**
- ✅ 入口位置（顶部导航栏） → Task 4
- ✅ 新页签打开 → Task 4 (window.open)
- ✅ 按迭代汇总 → Task 2 (manifest) + Task 3 (渲染)
- ✅ 左右分栏布局 → Task 3
- ✅ 需求文档 Tab：左目录 + 右内容 → Task 3 (renderDocTab)
- ✅ 流程图 Tab：左列表 + 右预览 → Task 3 (renderFlowTab)
- ✅ 文件命名约定 → Task 1 (重命名) + Task 2 (manifest)
- ✅ markdown 目录导航 → Task 3 (scrollToHeading)
- ✅ 流程图缩放/下载 → Task 3 (zoomFlow/downloadFlow)
- ✅ 空状态 → Task 3
- ✅ 仅演示模式可见 → Task 4 (demoMode check)

**Placeholder scan:** 无 TBD/TODO/placeholder。

**Type consistency:** `doc-manifest.json` 的 versions 结构与 doc-center.html 中的解析逻辑一致。
