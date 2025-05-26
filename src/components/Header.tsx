import React from 'react';
import { Layers, Settings, User, VolumeX, Volume2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  togglePanel: () => void;
  toggleAuthModal: () => void;
  toggleAudio: () => void;
  audioEnabled: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  togglePanel, 
  toggleAuthModal, 
  toggleAudio,
  audioEnabled
}) => {
  const { user } = useAuth();
  const [showHelpModal, setShowHelpModal] = React.useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <div className="flex items-center">
          <Layers className="text-blue-400 mr-2" size={28} />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            AquaFlow AI
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAudio}
            className="p-2 rounded-full bg-gray-800 bg-opacity-70 text-gray-200 hover:text-white hover:bg-opacity-90 transition-colors"
            title={audioEnabled ? "Disable sound reactivity" : "Enable sound reactivity"}
          >
            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-full bg-gray-800 bg-opacity-70 text-gray-200 hover:text-white hover:bg-opacity-90 transition-colors"
            title="How to use"
          >
            <Info size={20} />
          </button>
          
          <button
            onClick={togglePanel}
            className="p-2 rounded-full bg-gray-800 bg-opacity-70 text-gray-200 hover:text-white hover:bg-opacity-90 transition-colors"
            title="Open controls"
          >
            <Settings size={20} />
          </button>
          
          <button
            onClick={toggleAuthModal}
            className="p-2 rounded-full bg-gray-800 bg-opacity-70 text-gray-200 hover:text-white hover:bg-opacity-90 transition-colors"
            title={user ? "Account settings" : "Sign in"}
          >
            <User size={20} />
          </button>
        </div>
      </div>
      
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">How to use AquaFlow AI</h2>
              
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white">Interaction</h3>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Left-click/single-touch drag: Apply velocity (directional force)</li>
                    <li>Right-click/two-finger touch: Add density (color/smoke)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white">Sound Reactivity</h3>
                  <p className="mt-2">
                    Click the sound icon to enable microphone access. The fluid will react to sounds in your environment:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Bass frequencies: Large-scale turbulence</li>
                    <li>High frequencies: Detailed ripples</li>
                    <li>Volume: Overall intensity</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white">Control Panel</h3>
                  <p className="mt-2">
                    Click the settings icon to open the control panel where you can adjust:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Fluid properties: viscosity, diffusion, pressure, vorticity</li>
                    <li>Visual effects: bloom intensity, particle count</li>
                    <li>Color palettes and custom colors</li>
                    <li>Toggle gravity and fullscreen mode</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white">Presets</h3>
                  <p className="mt-2">
                    Sign in to save your favorite configurations as presets that you can load anytime.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;