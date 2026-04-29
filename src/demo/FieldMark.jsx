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
