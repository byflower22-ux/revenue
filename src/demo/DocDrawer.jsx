import { useState, useEffect, useCallback, useRef } from 'react';
import { Drawer, Tabs, Tag, Button, Space, Tooltip } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, DownloadOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useDemo } from './DemoProvider';

const typeColors = { new: 'green', modified: 'orange', optimized: 'purple' };
const typeLabels = { new: '新增', modified: '修改', optimized: '优化' };

export default function DocDrawer() {
  const { demoMode, config } = useDemo();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('doc');
  const [drawerWidth, setDrawerWidth] = useState(520);
  const [zoom, setZoom] = useState(100);
  const dragState = useRef({ active: false, startX: 0, startW: 0 });

  useEffect(() => {
    window.__openDocDrawer = (data) => {
      setInfo(data);
      setOpen(true);
      setActiveTab(data.tab || 'doc');
      setZoom(100);
    };
    return () => { delete window.__openDocDrawer; };
  }, []);

  // ── Global mouse move/up ──
  useEffect(() => {
    const onMove = (e) => {
      const ds = dragState.current;
      if (!ds.active) return;
      const next = Math.max(360, Math.min(900, ds.startW + (ds.startX - e.clientX)));
      setDrawerWidth(next);
    };
    const onUp = () => {
      const ds = dragState.current;
      if (!ds.active) return;
      ds.active = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onDragStart = useCallback((e) => {
    e.preventDefault();
    dragState.current = { active: true, startX: e.clientX, startW: drawerWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [drawerWidth]);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(300, z + 25)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(25, z - 25)), []);
  const handleZoomReset = useCallback(() => setZoom(100), []);

  const handleDownload = useCallback(() => {
    if (!info?.docKey) return;
    const doc = config.docs[info.docKey];
    if (!doc?.flow) return;
    const basePath = import.meta.env.BASE_URL || '/';
    const url = doc.flow.startsWith('http') ? doc.flow : `${basePath}${doc.flow}`.replace(/\/+/g, '/');
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.flow.split('/').pop();
    a.click();
  }, [info, config]);

  if (!demoMode || !info) return null;

  const doc = info.docKey ? config.docs[info.docKey] : null;
  const basePath = import.meta.env.BASE_URL || '/';

  const resolveUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${basePath}${path}`.replace(/\/+/g, '/');
  };

  return (
    <Drawer
      title={null}
      placement="right"
      width={drawerWidth}
      open={open}
      onClose={() => setOpen(false)}
      closable={false}
      styles={{ body: { padding: 0 } }}
    >
      {/* Drag handle — inside Drawer, fixed to its left edge */}
      <div
        className="demo-drawer-drag-strip"
        onMouseDown={onDragStart}
      />

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
        onChange={(key) => { setActiveTab(key); setZoom(100); }}
        items={[
          {
            key: 'doc',
            label: '需求文档',
            children: (
              <div style={{ padding: 0 }}>
                {doc?.prd ? (
                  <iframe
                    src={resolveUrl(doc.prd)}
                    style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none' }}
                    title="PRD文档"
                  />
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
              <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
                {doc?.flow ? (
                  <>
                    <div className="demo-flow-toolbar">
                      <Space size={4}>
                        <Tooltip title="缩小">
                          <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={zoom <= 25} />
                        </Tooltip>
                        <span className="demo-flow-zoom-label" onClick={handleZoomReset} title="点击重置">{zoom}%</span>
                        <Tooltip title="放大">
                          <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={zoom >= 300} />
                        </Tooltip>
                        <Tooltip title="适应宽度">
                          <Button size="small" icon={<FullscreenOutlined />} onClick={handleZoomReset} />
                        </Tooltip>
                        <Tooltip title="下载">
                          <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload} />
                        </Tooltip>
                      </Space>
                    </div>
                    <div className="demo-flow-viewer">
                      <img
                        src={resolveUrl(doc.flow)}
                        alt="流程图"
                        style={{ width: zoom === 100 ? '100%' : `${zoom}%`, borderRadius: 6, border: '1px solid #f0f0f0' }}
                      />
                    </div>
                  </>
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
        style={{ paddingLeft: 0, paddingRight: 0 }}
      />
    </Drawer>
  );
}
