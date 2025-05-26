import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

interface Preset {
  id: string;
  name: string;
  config: Partial<SimulationConfig>;
  user_id: string;
}

export interface SimulationConfig {
  viscosity: number;
  diffusion: number;
  pressure: number;
  vorticity: number;
  bloomIntensity: number;
  particleCount: number;
  gravity: boolean;
  fullscreen: boolean;
  palette: string;
  customColor: string;
  presetName: string;
}

interface SimulationContextType {
  config: SimulationConfig;
  presets: Preset[];
  updateConfig: (updates: Partial<SimulationConfig>) => void;
  savePreset: () => Promise<void>;
  loadPreset: (id: string) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
}

const defaultConfig: SimulationConfig = {
  viscosity: 0.015,
  diffusion: 0.0001,
  pressure: 0.3,
  vorticity: 0.2,
  bloomIntensity: 0.6,
  particleCount: 1000,
  gravity: false,
  fullscreen: false,
  palette: 'ocean',
  customColor: '#4cc9f0',
  presetName: ''
};

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SimulationConfig>(defaultConfig);
  const [presets, setPresets] = useState<Preset[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setPresets([]);
      return;
    }

    const fetchPresets = async () => {
      try {
        const { data, error } = await supabase
          .from('presets')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        setPresets(data || []);
      } catch (error) {
        console.error('Error fetching presets:', error);
      }
    };

    fetchPresets();
  }, [user]);

  const updateConfig = (updates: Partial<SimulationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const savePreset = async () => {
    if (!user) return;
    if (!config.presetName.trim()) return;

    const presetData = {
      name: config.presetName,
      config: { ...config },
      user_id: user.id
    };

    try {
      const { data, error } = await supabase
        .from('presets')
        .insert([presetData])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPresets(prev => [...prev, data[0]]);
        updateConfig({ presetName: '' });
      }
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  };

  const loadPreset = async (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    setConfig({
      ...defaultConfig,
      ...preset.config,
      presetName: ''
    });
  };

  const deletePreset = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('presets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setPresets(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting preset:', error);
    }
  };

  return (
    <SimulationContext.Provider
      value={{
        config,
        presets,
        updateConfig,
        savePreset,
        loadPreset,
        deletePreset
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};