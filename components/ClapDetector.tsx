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
        analyser.smoothingTimeConstant = 0.2;
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
    
    // Stop tracks to release mic
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

    // Clap Logic:
    // 1. Sudden volume spike (transient)
    // 2. High frequency content (2kHz+)
    
    // FFT 512 -> 256 bins. Max freq ~22kHz (if 44.1k). Each bin ~86Hz.
    // 2000Hz is around bin 23.
    // 6000Hz is around bin 70.
    
    let highFreqEnergy = 0;
    const startBin = 20; 
    const endBin = 80; 
    
    for (let i = startBin; i < endBin; i++) {
        highFreqEnergy += dataArray[i];
    }
    const avgEnergy = highFreqEnergy / (endBin - startBin);
    
    // Base threshold inverted by sensitivity (0-100)
    // Sensitivity 50 -> Threshold 70
    // Sensitivity 90 -> Threshold 30
    const threshold = 120 - sensitivity; 

    const now = Date.now();
    // Debounce 500ms
    if (avgEnergy > threshold && now - lastClapTimeRef.current > 500) {
        console.log("CLAP!", avgEnergy);
        onClap();
        lastClapTimeRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(detectClap);
  };

  return null;
};

export default ClapDetector;
