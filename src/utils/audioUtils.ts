// Audio analyzer utility for sound reactivity

export const setupAudioAnalyzer = async () => {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    
    // Connect microphone to analyzer
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Configure analyzer
    analyser.fftSize = 1024;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Function to get audio data
    const getAudioData = () => {
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Segment the frequency spectrum
      const lowEnd = 5;       // 0-120Hz (bass)
      const midRange = 30;    // 120-2kHz (midrange)
      const highRange = 100;  // 2kHz+ (high end)
      
      // Calculate average values for each frequency range
      let lowSum = 0;
      for (let i = 0; i < lowEnd; i++) {
        lowSum += dataArray[i];
      }
      
      let midSum = 0;
      for (let i = lowEnd; i < midRange; i++) {
        midSum += dataArray[i];
      }
      
      let highSum = 0;
      for (let i = midRange; i < highRange; i++) {
        highSum += dataArray[i];
      }
      
      // Normalize values between 0 and 1
      const lowFreq = lowSum / (lowEnd * 255);
      const midFreq = midSum / ((midRange - lowEnd) * 255);
      const highFreq = highSum / ((highRange - midRange) * 255);
      
      // Calculate overall volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const volume = sum / (bufferLength * 255);
      
      return {
        lowFreq,
        midFreq,
        highFreq,
        volume
      };
    };
    
    // Disconnect function
    const disconnect = () => {
      source.disconnect();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    
    return {
      getAudioData,
      disconnect
    };
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw error;
  }
};