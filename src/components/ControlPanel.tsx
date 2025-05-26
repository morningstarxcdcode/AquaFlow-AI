import React from 'react';
import { X, Save, Trash, CloudLightning, Droplets, Palette } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { useAuth } from '../context/AuthContext';
import ColorPalette from './ColorPalette';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig, savePreset, presets, loadPreset, deletePreset } = useSimulation();
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-800 bg-opacity-90 shadow-lg z-30 transition-transform transform translate-x-0 p-6 overflow-y-auto backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Controls</h2>
        <button 
          onClick={onClose}
          className="text-gray-300 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Droplets size={18} className="mr-2 text-blue-400" />
            Fluid Properties
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Viscosity
              </label>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.001"
                value={config.viscosity}
                onChange={(e) => updateConfig({ viscosity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Diffusion
              </label>
              <input
                type="range"
                min="0"
                max="0.001"
                step="0.0001"
                value={config.diffusion}
                onChange={(e) => updateConfig({ diffusion: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pressure
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.01"
                value={config.pressure}
                onChange={(e) => updateConfig({ pressure: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Vorticity
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={config.vorticity}
                onChange={(e) => updateConfig({ vorticity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Palette size={18} className="mr-2 text-purple-400" />
            Appearance
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bloom Intensity
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.bloomIntensity}
              onChange={(e) => updateConfig({ bloomIntensity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Particles
            </label>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={config.particleCount}
              onChange={(e) => updateConfig({ particleCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Color Palette
            </label>
            <ColorPalette />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <CloudLightning size={18} className="mr-2 text-yellow-400" />
            Effects
          </h3>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              Gravity
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.gravity}
                onChange={(e) => updateConfig({ gravity: e.target.checked })}
              />
              <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              Fullscreen
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.fullscreen}
                onChange={(e) => {
                  updateConfig({ fullscreen: e.target.checked });
                  if (e.target.checked) {
                    document.documentElement.requestFullscreen().catch(err => {
                      console.error('Error attempting to enable fullscreen:', err);
                    });
                  } else if (document.fullscreenElement) {
                    document.exitFullscreen();
                  }
                }}
              />
              <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        {user && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white">Presets</h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Preset name"
                className="flex-1 px-3 py-2 bg-gray-700 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.presetName}
                onChange={(e) => updateConfig({ presetName: e.target.value })}
              />
              <button
                onClick={() => savePreset()}
                disabled={!config.presetName}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save Preset"
              >
                <Save size={18} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {presets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                  <button
                    className="text-sm text-white hover:text-blue-300 text-left flex-1 truncate"
                    onClick={() => loadPreset(preset.id)}
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="text-gray-400 hover:text-red-400"
                    title="Delete Preset"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              {presets.length === 0 && (
                <p className="text-sm text-gray-400">No saved presets</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;