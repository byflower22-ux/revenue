import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { iterations as defaultConfig } from './iterations';

const STORAGE_KEY = 'demo-iterations-config';
const DemoContext = createContext(null);

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) return { demoMode: false, activeVersion: 'all', isDimmed: () => false, config: defaultConfig };
  return ctx;
}

export function DemoProvider({ children }) {
  const [demoMode, setDemoMode] = useState(true);
  const [activeVersion, setActiveVersion] = useState('all');
  const [config, setConfig] = useState(() => loadConfig() || {
    versions: defaultConfig.versions,
    docs: defaultConfig.docs,
    marks: defaultConfig.marks,
  });

  const toggleDemo = useCallback(() => setDemoMode(prev => !prev), []);
  const filterVersion = useCallback((ver) => setActiveVersion(ver), []);

  const isDimmed = useCallback((version) => {
    if (activeVersion === 'all') return false;
    return version !== activeVersion;
  }, [activeVersion]);

  const updateConfig = useCallback((updater) => {
    setConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveConfig(next);
      return next;
    });
  }, []);

  // Version CRUD
  const addVersion = useCallback((ver) => {
    updateConfig(prev => ({ ...prev, versions: [...prev.versions, ver] }));
  }, [updateConfig]);

  const editVersion = useCallback((key, data) => {
    updateConfig(prev => ({
      ...prev,
      versions: prev.versions.map(v => v.key === key ? { ...v, ...data } : v),
    }));
  }, [updateConfig]);

  const deleteVersion = useCallback((key) => {
    updateConfig(prev => ({
      ...prev,
      versions: prev.versions.filter(v => v.key !== key),
    }));
  }, [updateConfig]);

  // Mark CRUD
  const addMark = useCallback((markKey, data) => {
    updateConfig(prev => ({ ...prev, marks: { ...prev.marks, [markKey]: data } }));
  }, [updateConfig]);

  const editMark = useCallback((markKey, data) => {
    updateConfig(prev => ({
      ...prev,
      marks: { ...prev.marks, [markKey]: { ...prev.marks[markKey], ...data } },
    }));
  }, [updateConfig]);

  const deleteMark = useCallback((markKey) => {
    updateConfig(prev => {
      const { [markKey]: _, ...rest } = prev.marks;
      return { ...prev, marks: rest };
    });
  }, [updateConfig]);

  // Doc CRUD
  const addDoc = useCallback((docKey, data) => {
    updateConfig(prev => ({ ...prev, docs: { ...prev.docs, [docKey]: data } }));
  }, [updateConfig]);

  const editDoc = useCallback((docKey, data) => {
    updateConfig(prev => ({
      ...prev,
      docs: { ...prev.docs, [docKey]: { ...prev.docs[docKey], ...data } },
    }));
  }, [updateConfig]);

  const deleteDoc = useCallback((docKey) => {
    updateConfig(prev => {
      const { [docKey]: _, ...rest } = prev.docs;
      return { ...prev, docs: rest };
    });
  }, [updateConfig]);

  const resetConfig = useCallback(() => {
    const defaults = {
      versions: defaultConfig.versions,
      docs: defaultConfig.docs,
      marks: defaultConfig.marks,
    };
    saveConfig(defaults);
    setConfig(defaults);
  }, []);

  const value = useMemo(() => ({
    demoMode, activeVersion, config,
    toggleDemo, filterVersion, isDimmed,
    addVersion, editVersion, deleteVersion,
    addMark, editMark, deleteMark,
    addDoc, editDoc, deleteDoc,
    resetConfig,
  }), [
    demoMode, activeVersion, config,
    toggleDemo, filterVersion, isDimmed,
    addVersion, editVersion, deleteVersion,
    addMark, editMark, deleteMark,
    addDoc, editDoc, deleteDoc,
    resetConfig,
  ]);

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}
