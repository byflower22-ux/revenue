import { useState } from 'react';
import { useDemo } from './DemoProvider';

const typeConfig = {
  new: { label: '新增', color: '#52c41a' },
  modified: { label: '修改', color: '#fa8c16' },
  optimized: { label: '优化', color: '#722ed1' },
};

export default function IterationMark({ children, mark, version, date, type = 'new', label, docKey }) {
  const { demoMode, isDimmed, config } = useDemo();
  const [hover, setHover] = useState(false);

  const markData = mark ? config.marks[mark] : null;
  const v = markData?.version || version;
  const d = markData ? (config.versions.find(ver => ver.key === markData.version)?.date || date) : date;
  const t = markData?.type || type;
  const l = markData?.label || label;
  const dk = markData?.docKey ?? docKey;

  if (!demoMode) return <>{children}</>;

  const dimmed = isDimmed(v);
  const tc = typeConfig[t] || typeConfig.new;
  const ver = config.versions.find(ver => ver.key === v);
  const verLabel = ver ? `${ver.label} (${ver.date})` : `${v}迭代 (${d})`;

  const handleClickBadge = (e, action) => {
    e.stopPropagation();
    if (window.__openDocDrawer) {
      window.__openDocDrawer({ title: l, version: v, date: d, type: t, docKey: dk, tab: action });
    }
  };

  const doc = dk ? config.docs[dk] : null;

  return (
    <div
      className={`demo-iteration-mark ${dimmed ? 'demo-dimmed' : ''} ${hover ? 'demo-hover' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="demo-iteration-badges">
        <span className="demo-badge demo-badge-version" onClick={(e) => handleClickBadge(e)}>
          {verLabel}
        </span>
        <span className="demo-badge" style={{ background: tc.color, color: '#fff' }}>
          {tc.label}
        </span>
        {doc && doc.prd && (
          <span className="demo-badge demo-badge-link" onClick={(e) => handleClickBadge(e, 'doc')}>
            📄 PRD
          </span>
        )}
        {doc && doc.flow && (
          <span className="demo-badge demo-badge-flow" onClick={(e) => handleClickBadge(e, 'flow')}>
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
