import React, { useState } from 'react';
import { Layers, Settings, User, VolumeX, Volume2 } from 'lucide-react';
import FluidSimulation from './components/FluidSimulation';
import ControlPanel from './components/ControlPanel';
import AuthModal from './components/AuthModal';
import { SimulationProvider } from './context/SimulationContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';

function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };
  
  const toggleAuthModal = () => {
    setIsAuthModalOpen(!isAuthModalOpen);
  };
  
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  return (
    <AuthProvider>
      <SimulationProvider>
        <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
          <Header 
            togglePanel={togglePanel} 
            toggleAuthModal={toggleAuthModal}
            toggleAudio={toggleAudio}
            audioEnabled={audioEnabled}
          />
          
          <div className="absolute inset-0 z-0">
            <FluidSimulation audioEnabled={audioEnabled} />
          </div>
          
          <ControlPanel isOpen={isPanelOpen} onClose={togglePanel} />
          
          {isAuthModalOpen && (
            <AuthModal onClose={toggleAuthModal} />
          )}
          
          <div className="absolute bottom-4 left-4 z-20 text-sm text-gray-400 pointer-events-none">
            AquaFlow AI v1.0
          </div>
        </div>
      </SimulationProvider>
    </AuthProvider>
  );
}

export default App;