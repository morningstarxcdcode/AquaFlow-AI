import React, { useRef, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { initFluidSimulation } from '../fluid/fluidSimulation';
import { setupAudioAnalyzer } from '../utils/audioUtils';

interface FluidSimulationProps {
  audioEnabled: boolean;
}

const FluidSimulation: React.FC<FluidSimulationProps> = ({ audioEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { config } = useSimulation();
  const animationRef = useRef<number>(0);
  const fluidRef = useRef<any>(null);
  const audioAnalyzerRef = useRef<any>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const fluid = initFluidSimulation(canvas, config);
    fluidRef.current = fluid;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (fluidRef.current) {
        fluidRef.current.resize(canvas.width, canvas.height);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!fluidRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (e.buttons === 1) { // Left mouse button
        fluidRef.current.addVelocity(x, y, e.movementX, e.movementY);
      } else if (e.buttons === 2) { // Right mouse button
        fluidRef.current.addDensity(x, y, config.palette);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!fluidRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Calculate movement with better tracking
        const prevTouches = (e as any).previousTouches;
        let movementX = 0;
        let movementY = 0;
        if (prevTouches && prevTouches.length > 0) {
          movementX = touch.clientX - prevTouches[0].clientX;
          movementY = touch.clientY - prevTouches[0].clientY;
        }

        console.log('Touch move:', { x, y, movementX, movementY });
        fluidRef.current.addVelocity(x, y, movementX * 2, movementY * 2);

        // Store previous touches
        (e as any).previousTouches = Array.from(e.touches);
      } else if (e.touches.length === 2) {
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        console.log('Touch density add:', { x, y, palette: config.palette });
        fluidRef.current.addDensity(x, y, config.palette);
      }
    };
  
  // ...

  useEffect(() => {
    if (audioEnabled && !audioAnalyzerRef.current) {
      setupAudioAnalyzer().then(analyzer => {
        audioAnalyzerRef.current = analyzer;
      }).catch(err => {
        console.error('Error setting up audio analyzer:', err);
      });
    } else if (!audioEnabled && audioAnalyzerRef.current) {
      audioAnalyzerRef.current.disconnect();
      audioAnalyzerRef.current = null;
    }
  }, [audioEnabled]);

  useEffect(() => {
    if (!audioEnabled) {
      // Provide fallback audio data to avoid zero audio input
      if (fluidRef.current) {
        fluidRef.current.updateWithAudio({
          lowFreq: 0.1,
          midFreq: 0.1,
          highFreq: 0.1,
          volume: 0.1
        });
      }
    }
  }, [audioEnabled]);
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    const animate = () => {
      if (fluidRef.current) {
        // Update with audio data if enabled
        if (audioEnabled && audioAnalyzerRef.current) {
          const audioData = audioAnalyzerRef.current.getAudioData();
          fluidRef.current.updateWithAudio(audioData);
        }
        
        fluidRef.current.update();
        fluidRef.current.render();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      if (fluidRef.current) {
        fluidRef.current.destroy();
      }
    };
  }, [config]);
  
  // Set up audio analyzer when audioEnabled changes
  useEffect(() => {
    if (audioEnabled && !audioAnalyzerRef.current) {
      setupAudioAnalyzer().then(analyzer => {
        audioAnalyzerRef.current = analyzer;
      }).catch(err => {
        console.error('Error setting up audio analyzer:', err);
      });
    } else if (!audioEnabled && audioAnalyzerRef.current) {
      audioAnalyzerRef.current.disconnect();
      audioAnalyzerRef.current = null;
    }
  }, [audioEnabled]);
  
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  );
};

export default FluidSimulation;