import { Switch, Tag } from 'antd';
import { useDemo } from './DemoProvider';

export default function DemoToggle() {
  const { demoMode, activeVersion, toggleDemo, filterVersion, config } = useDemo();

  return (
    <div className="demo-toggle-bar">
      <div className="demo-toggle-left">
        <Switch size="small" checked={demoMode} onChange={toggleDemo} />
        <span className="demo-toggle-label">{demoMode ? '演示模式' : '纯净模式'}</span>
        {demoMode && (
          <>
            <span className="demo-toggle-divider" />
            <span className="demo-toggle-filter-label">筛选版本：</span>
            <div className="demo-version-tags">
              <Tag
                className={`demo-version-tag ${activeVersion === 'all' ? 'demo-version-active' : ''}`}
                onClick={() => filterVersion('all')}
              >
                全部
              </Tag>
              {config.versions.map(v => (
                <Tag
                  key={v.key}
                  className={`demo-version-tag ${activeVersion === v.key ? 'demo-version-active' : ''}`}
                  onClick={() => filterVersion(v.key)}
                >
                  {v.label} ({v.date})
                </Tag>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
