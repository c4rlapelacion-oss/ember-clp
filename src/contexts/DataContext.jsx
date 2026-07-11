import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createInitialData, DB_KEY, SESSION_KEY } from '../data/initialData';
import { makeId } from '../utils/security';

const DataContext = createContext(null);

function loadDatabase() {
  ['ember-demo-user', 'ember-clp-db', 'ember-current-user', 'ember-clp-database-v1', 'ember-clp-session-v1', 'ember-clp-database-v2', 'ember-clp-session-v2'].forEach((key) => localStorage.removeItem(key));
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    const initial = createInitialData();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.version === 3 && Array.isArray(parsed.users)) return parsed;
  } catch (error) {
    console.warn('EMBER database was unreadable and has been reset.', error);
  }
  const initial = createInitialData();
  localStorage.setItem(DB_KEY, JSON.stringify(initial));
  return initial;
}

export function DataProvider({ children }) {
  const [data, setData] = useState(loadDatabase);

  const commit = useCallback((updater) => {
    setData((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      localStorage.setItem(DB_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addNotification = useCallback((notification) => {
    commit((current) => ({
      ...current,
      notifications: [{ id: makeId('notification'), createdAt: new Date().toISOString(), read: false, ...notification }, ...current.notifications]
    }));
  }, [commit]);

  const addAuditLog = useCallback((action, actorId, details = '') => {
    commit((current) => ({
      ...current,
      auditLogs: [{ id: makeId('audit'), action, actorId, details, createdAt: new Date().toISOString() }, ...current.auditLogs]
    }));
  }, [commit]);

  const resetAllData = useCallback(() => {
    const initial = createInitialData();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    localStorage.removeItem(SESSION_KEY);
    setData(initial);
  }, []);

  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ember-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const value = useMemo(() => ({ data, commit, addNotification, addAuditLog, resetAllData, exportBackup }), [data, commit, addNotification, addAuditLog, resetAllData, exportBackup]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside DataProvider.');
  return context;
}
