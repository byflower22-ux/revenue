import { createContext, useContext, useState, useCallback } from 'react';

const DemoContext = createContext(null);

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) return { demoMode: false, activeVersion: 'all', isDimmed: () => false };
  return ctx;
}

export function DemoProvider({ children }) {
  const [demoMode, setDemoMode] = useState(true);
  const [activeVersion, setActiveVersion] = useState('all');

  const toggleDemo = useCallback(() => setDemoMode(prev => !prev), []);
  const filterVersion = useCallback((ver) => setActiveVersion(ver), []);

  const isDimmed = useCallback((version) => {
    if (activeVersion === 'all') return false;
    return version !== activeVersion;
  }, [activeVersion]);

  return (
    <DemoContext.Provider value={{ demoMode, activeVersion, toggleDemo, filterVersion, isDimmed }}>
      {children}
    </DemoContext.Provider>
  );
}
