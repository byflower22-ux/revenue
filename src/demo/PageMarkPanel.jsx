import { useState, useMemo } from 'react';
import { useDemo } from './DemoProvider';
import { pageMap } from './iterations';

const typeColors = { new: '#52c41a', modified: '#fa8c16', optimized: '#722ed1' };
const typeLabels = { new: '新增', modified: '修改', optimized: '优化' };

export default function PageMarkPanel() {
  const { demoMode, currentPage, config, isDimmed } = useDemo();
  const [expanded, setExpanded] = useState(true);

  const marks = useMemo(() => {
    if (!currentPage) return [];
    return Object.entries(config.marks)
      .filter(([, m]) => m.page === currentPage)
      .map(([key, m]) => {
        const ver = config.versions.find(v => v.key === m.version);
        return { key, ...m, verLabel: ver ? `${ver.label} (${ver.date})` : m.version };
      });
  }, [currentPage, config]);

  if (!demoMode || !currentPage || marks.length === 0) return null;

  const pageName = pageMap[currentPage] || currentPage;

  const handleClick = (m) => {
    if (window.__openDocDrawer) {
      const ver = config.versions.find(v => v.key === m.version);
      window.__openDocDrawer({
        title: m.label,
        version: m.version,
        date: ver?.date || '',
        type: m.type,
        docKey: m.docKey,
      });
    }
  };

  if (!expanded) {
    return (
      <div className="demo-page-mark-fab" onClick={() => setExpanded(true)}>
        📌 {marks.length}
      </div>
    );
  }

  return (
    <div className="demo-page-mark-panel">
      <div className="demo-page-mark-header">
        <span>{pageName} · {marks.length}个标记</span>
        <span className="demo-page-mark-collapse" onClick={() => setExpanded(false)}>收起</span>
      </div>
      <div className="demo-page-mark-list">
        {marks.map(m => {
          const dimmed = isDimmed(m.version);
          return (
            <div
              key={m.key}
              className={`demo-page-mark-item ${dimmed ? 'demo-dimmed' : ''}`}
              onClick={() => handleClick(m)}
            >
              <span className="demo-page-mark-ver">{m.version}</span>
              <span
                className="demo-page-mark-type"
                style={{ background: typeColors[m.type] || '#999', color: '#fff' }}
              >
                {typeLabels[m.type] || m.type}
              </span>
              <span className="demo-page-mark-label">{m.label}</span>
              {m.field
                ? <span className="demo-page-mark-field">{m.field}</span>
                : (m.section && <span className="demo-page-mark-section">{m.section}</span>)
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
