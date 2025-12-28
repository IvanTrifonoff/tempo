import React, { useEffect, useRef } from 'react';

interface ClapDetectorProps {
  isEnabled: boolean;
  sensitivity: number; // 0-100
  onClap: () => void;
  onLevelChange?: (level: number) => void;
  audioContext: AudioContext | null;
  stream: MediaStream | null;
}

const ClapDetector: React.FC<ClapDetectorProps> = ({ isEnabled, sensitivity, onClap, onLevelChange, audioContext, stream }) => {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  
  const clapsHistoryRef = useRef<number[]>([]);
  const lastSignalTimeRef = useRef<number>(0);
  const backgroundNoiseRef = useRef<number>(5);
  const previousEnergyRef = useRef<number>(0);

  useEffect(() => {
    if (!isEnabled || !audioContext || !stream) {
      cleanup();
      return;
    }

    const initAnalysis = () => {
      try {
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0; // CRITICAL: No smoothing to catch fast peaks
        source.connect(analyser);

        analyserRef.current = analyser;
        sourceRef.current = source;

        detectClap();
      } catch (err) {
        console.error("Clap analysis init error:", err);
      }
    };

    initAnalysis();

    return () => cleanup();
  }, [isEnabled, audioContext, stream]);

  const cleanup = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
  };

  const detectClap = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Filter focus: 2.5kHz - 8kHz (where claps are crisp)
    let bandEnergy = 0;
    const startBin = 30;
    const endBin = 100;
    
    for (let i = startBin; i < endBin; i++) {
        bandEnergy += dataArray[i];
    }
    const currentVolume = bandEnergy / (endBin - startBin);

    // Update UI level (scaled for better visibility)
    if (onLevelChange) onLevelChange(currentVolume * 1.5);

    // 1. Adaptive noise floor
    if (currentVolume > backgroundNoiseRef.current) {
        backgroundNoiseRef.current = backgroundNoiseRef.current * 0.99 + currentVolume * 0.01; 
    } else {
        backgroundNoiseRef.current = backgroundNoiseRef.current * 0.95 + currentVolume * 0.05;
    }

    // 2. Transient Check (The "Sharpness")
    // A clap is a sudden jump from silence/background
    const ratio = currentVolume / (previousEnergyRef.current || 1);
    const isSudden = ratio > 2.2; // Energy must more than double in 16ms

    // 3. Dynamic Threshold
    const multiplier = 4.5 - (sensitivity / 100) * 3.0; 
    const threshold = Math.max(25, backgroundNoiseRef.current * multiplier);

    if (currentVolume > threshold && isSudden) {
        const now = Date.now();
        // Cooldown between individual pulses (avoid echo of same clap)
        if (now - lastSignalTimeRef.current > 150) {
            clapsHistoryRef.current.push(now);
            lastSignalTimeRef.current = now;
            console.log("Clap Signal!");
        }
    }
    
    previousEnergyRef.current = currentVolume;

    // 4. Double Clap Logic (2 signals within 800ms)
    const now = Date.now();
    clapsHistoryRef.current = clapsHistoryRef.current.filter(t => now - t < 800);
    
    if (clapsHistoryRef.current.length >= 2) {
        console.log("ACTION: DOUBLE CLAP DETECTED");
        onClap();
        clapsHistoryRef.current = []; 
    }

    rafIdRef.current = requestAnimationFrame(detectClap);
  };

  return null;
};

export default ClapDetector;