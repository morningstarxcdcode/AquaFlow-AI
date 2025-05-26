import React from 'react';
import { useSimulation } from '../context/SimulationContext';

const ColorPalette: React.FC = () => {
  const { config, updateConfig } = useSimulation();
  
  const palettes = [
    { id: 'ocean', name: 'Ocean Blue', colors: ['#001233', '#0353a4', '#023e7d', '#0096c7', '#48cae4'] },
    { id: 'lava', name: 'Lava Red', colors: ['#370617', '#6a040f', '#9d0208', '#d00000', '#dc2f02'] },
    { id: 'nebula', name: 'Nebula Purple', colors: ['#240046', '#3c096c', '#5a189a', '#7b2cbf', '#9d4edd'] },
    { id: 'forest', name: 'Forest Green', colors: ['#081c15', '#1b4332', '#2d6a4f', '#40916c', '#52b788'] },
    { id: 'sunset', name: 'Sunset', colors: ['#ff7700', '#ff9e00', '#ffb700', '#ffd000', '#ffea00'] },
    { id: 'neon', name: 'Neon', colors: ['#ff0080', '#ff00ff', '#8000ff', '#0000ff', '#0080ff'] },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {palettes.map((palette) => (
          <button
            key={palette.id}
            onClick={() => updateConfig({ palette: palette.id })}
            className={`relative p-1 h-14 rounded overflow-hidden border-2 ${
              config.palette === palette.id ? 'border-white' : 'border-transparent'
            }`}
            title={palette.name}
          >
            <div className="flex h-full w-full">
              {palette.colors.map((color, index) => (
                <div
                  key={index}
                  className="h-full flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="absolute bottom-0 left-0 right-0 text-[10px] text-white text-center bg-black bg-opacity-50 py-0.5">
              {palette.name}
            </span>
          </button>
        ))}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Custom Color
        </label>
        <input
          type="color"
          value={config.customColor}
          onChange={(e) => updateConfig({ customColor: e.target.value })}
          className="w-full h-10 rounded cursor-pointer bg-transparent"
        />
      </div>
    </div>
  );
};

export default ColorPalette;