import React, { useEffect, useRef, useState } from 'react';

interface ClapDetectorProps {
  isEnabled: boolean;
  sensitivity: number; // 0-100
  onClap: () => void;
}

const ClapDetector: React.FC<ClapDetectorProps> = ({ isEnabled, sensitivity, onClap }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastClapTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isEnabled) {
      cleanup();
      return;
    }

    const startListening = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: true, 
                noiseSuppression: true,
                autoGainControl: false
            } 
        });

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.1;
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        detectClap();
      } catch (err) {
        console.error("Mic access error:", err);
      }
    };

    startListening();

    return () => cleanup();
  }, [isEnabled]);

  const cleanup = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    audioContextRef.current?.close();
    
    if (sourceRef.current) {
        // @ts-ignore
        const stream = sourceRef.current.mediaStream;
        if (stream) {
            stream.getTracks().forEach((t: any) => t.stop());
        }
    }
  };

  const detectClap = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let highFreqEnergy = 0;
    const startBin = 15; // Focus on 1.2kHz+
    const endBin = 70;   // up to ~6kHz
    
    for (let i = startBin; i < endBin; i++) {
        highFreqEnergy += dataArray[i];
    }
    const avgEnergy = highFreqEnergy / (endBin - startBin);

    // Map sensitivity (0-100) to a threshold (150-50).
    // High sensitivity (100) -> lower threshold (50)
    // Low sensitivity (0) -> higher threshold (150)
    const threshold = 150 - (sensitivity);
    
    const now = Date.now();
    if (avgEnergy > threshold && now - lastClapTimeRef.current > 800) { // Cooldown 800ms
        console.log("CLAP! Energy:", avgEnergy, "vs Threshold:", threshold);
        onClap();
        lastClapTimeRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(detectClap);
  };

  return null;
};

export default ClapDetector;
