import { useState } from 'react';
import { useDemo } from './DemoProvider';
import { iterations } from './iterations';

const typeConfig = {
  new: { label: '新增', color: '#52c41a' },
  modified: { label: '修改', color: '#fa8c16' },
  optimized: { label: '优化', color: '#722ed1' },
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
