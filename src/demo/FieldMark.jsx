import { useDemo } from './DemoProvider';

const typeConfig = {
  new: { label: '新增', icon: '✨', cssClass: 'demo-field-new' },
  modified: { label: '修改', icon: '✏️', cssClass: 'demo-field-modified' },
  optimized: { label: '优化', icon: '🔧', cssClass: 'demo-field-optimized' },
};

export default function FieldMark({ children, mark, section, field, version, date, type = 'new', docKey }) {
  const { demoMode, isDimmed, config, currentPage } = useDemo();

  let resolvedKey = mark;
  if (!mark && section && currentPage) {
    const entry = Object.entries(config.marks).find(
      ([, m]) => m.page === currentPage && m.section === section && m.field === (field || null)
    );
    if (entry) resolvedKey = entry[0];
  }

  const markData = resolvedKey ? config.marks[resolvedKey] : null;

  if (!demoMode) return <>{children}</>;
  if (!markData && !version) return <>{children}</>;

  const v = markData?.version || version;
  const d = markData ? (config.versions.find(ver => ver.key === markData.version)?.date || date) : date;
  const t = markData?.type || type;
  const dk = markData?.docKey ?? docKey;

  const dimmed = isDimmed(v);
  const tc = typeConfig[t] || typeConfig.new;

  const handleClick = (e) => {
    e.stopPropagation();
    if (window.__openDocDrawer) {
      window.__openDocDrawer({ title: '', version: v, date: d, type: t, docKey: dk, tab: 'doc' });
    }
  };

  return (
    <span className={`demo-field-mark ${dimmed ? 'demo-dimmed' : ''} ${tc.cssClass}`}>
      {typeof children === 'string'
        ? <>{children} <span className="demo-field-tag" onClick={handleClick}>{tc.icon} {v}{tc.label}</span></>
        : children
      }
    </span>
  );
}

export function FieldWrap({ children, mark, section, field, version, type = 'new' }) {
  const { demoMode, isDimmed, config, currentPage } = useDemo();

  let resolvedKey = mark;
  if (!mark && section && currentPage) {
    const entry = Object.entries(config.marks).find(
      ([, m]) => m.page === currentPage && m.section === section && m.field === (field || null)
    );
    if (entry) resolvedKey = entry[0];
  }

  const markData = resolvedKey ? config.marks[resolvedKey] : null;

  if (!demoMode) return <>{children}</>;
  if (!markData && !version) return <>{children}</>;

  const v = markData?.version || version;
  const t = markData?.type || type;

  const dimmed = isDimmed(v);
  const tc = typeConfig[t] || typeConfig.new;

  return (
    <span className={`demo-field-wrap ${tc.cssClass} ${dimmed ? 'demo-dimmed' : ''}`}>
      {children}
    </span>
  );
}
