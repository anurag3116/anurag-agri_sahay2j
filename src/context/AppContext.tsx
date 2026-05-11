import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserSettings = {
  theme: 'light' | 'dark';
  location: string;
  unit: 'metric' | 'imperial';
  language: string;
};

type AppContextType = {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  crops: any[];
  addCrop: (crop: any) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('agri_settings');
    return saved ? JSON.parse(saved) : { 
      theme: 'light', 
      location: 'Punjab, India', 
      unit: 'metric',
      language: 'English'
    };
  });

  const [crops, setCrops] = useState<any[]>(() => {
    const saved = localStorage.getItem('agri_crops');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('agri_settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('agri_crops', JSON.stringify(crops));
  }, [crops]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addCrop = (crop: any) => {
    setCrops(prev => [...prev, { ...crop, id: Date.now() }]);
  };

  return (
    <AppContext.Provider value={{ 
      settings, 
      updateSettings, 
      crops, 
      addCrop,
      isSidebarCollapsed,
      setIsSidebarCollapsed
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
