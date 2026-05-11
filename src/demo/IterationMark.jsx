import { useState } from 'react';
import { useDemo } from './DemoProvider';

const typeConfig = {
  new: { label: '新增', color: '#52c41a' },
  modified: { label: '修改', color: '#fa8c16' },
  optimized: { label: '优化', color: '#722ed1' },
};

export default function IterationMark({ children, mark, section, version, date, type = 'new', label, docKey }) {
  const { demoMode, isDimmed, config, currentPage } = useDemo();
  const [hover, setHover] = useState(false);

  // Resolve: section-based lookup (only area-level marks without field)
  let resolvedKey = mark;
  if (!mark && section && currentPage) {
    const entry = Object.entries(config.marks).find(
      ([, m]) => m.page === currentPage && m.section === section && !m.field
    );
    if (entry) resolvedKey = entry[0];
  }

  const markData = resolvedKey ? config.marks[resolvedKey] : null;

  // No mark data and no direct props → render children without marks
  if (!demoMode) return <>{children}</>;
  if (!markData && !version) return <>{children}</>;

  const v = markData?.version || version;
  const d = markData ? (config.versions.find(ver => ver.key === markData.version)?.date || date) : date;
  const t = markData?.type || type;
  const l = markData?.label || label;
  const dk = markData?.docKey ?? docKey;

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
        {l && (
          <span className="demo-badge demo-badge-label">{l}</span>
        )}
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
