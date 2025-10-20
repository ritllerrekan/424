import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIPreferences {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  defaultView: 'grid' | 'list';
  notificationsEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

interface UIPreferencesContextType {
  preferences: UIPreferences;
  updatePreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UIPreferences = {
  theme: 'light',
  sidebarCollapsed: false,
  defaultView: 'grid',
  notificationsEnabled: true,
  autoRefresh: false,
  refreshInterval: 30000,
};

const UI_PREFERENCES_KEY = 'ui_preferences';

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined);

export const UIPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UIPreferences>(() => {
    const stored = localStorage.getItem(UI_PREFERENCES_KEY);
    if (stored) {
      try {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to parse UI preferences:', error);
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = <K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <UIPreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
      {children}
    </UIPreferencesContext.Provider>
  );
};

export const useUIPreferences = () => {
  const context = useContext(UIPreferencesContext);
  if (!context) {
    throw new Error('useUIPreferences must be used within UIPreferencesProvider');
  }
  return context;
};
