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
