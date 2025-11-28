import { useEffect, useState, useRef } from "react";

export interface AudioAnalysisData {
  bass: number;      // 0-1, low frequencies (20-200 Hz)
  mids: number;      // 0-1, mid frequencies (200-2000 Hz)
  highs: number;     // 0-1, high frequencies (2000-20000 Hz)
  beat: boolean;     // Beat detected this frame
  volume: number;    // 0-1, overall volume
}

interface UseAudioAnalysisOptions {
  analyser: AnalyserNode | null;
  beatThreshold?: number;
  smoothing?: number;
}

export const useAudioAnalysis = ({ 
  analyser, 
  beatThreshold = 0.7,
  smoothing = 0.8 
}: UseAudioAnalysisOptions) => {
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData>({
    bass: 0,
    mids: 0,
    highs: 0,
    beat: false,
    volume: 0,
  });

  const animationFrameRef = useRef<number>();
  const prevBassRef = useRef(0);
  const prevMidsRef = useRef(0);
  const prevHighsRef = useRef(0);
  const prevVolumeRef = useRef(0);
  const beatCooldownRef = useRef(0);

  useEffect(() => {
    if (!analyser) {
      // Reset when no analyser
      setAnalysisData({
        bass: 0,
        mids: 0,
        highs: 0,
        beat: false,
        volume: 0,
      });
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate frequency ranges (approximate bin indices)
      const nyquist = analyser.context.sampleRate / 2;
      const binWidth = nyquist / bufferLength;

      // Bass: 20-200 Hz
      const bassEndBin = Math.floor(200 / binWidth);
      let bassSum = 0;
      for (let i = 0; i < bassEndBin && i < bufferLength; i++) {
        bassSum += dataArray[i];
      }
      const rawBass = (bassSum / bassEndBin) / 255;

      // Mids: 200-2000 Hz
      const midsStartBin = bassEndBin;
      const midsEndBin = Math.floor(2000 / binWidth);
      let midsSum = 0;
      for (let i = midsStartBin; i < midsEndBin && i < bufferLength; i++) {
        midsSum += dataArray[i];
      }
      const rawMids = (midsSum / (midsEndBin - midsStartBin)) / 255;

      // Highs: 2000-20000 Hz
      const highsStartBin = midsEndBin;
      let highsSum = 0;
      for (let i = highsStartBin; i < bufferLength; i++) {
        highsSum += dataArray[i];
      }
      const rawHighs = (highsSum / (bufferLength - highsStartBin)) / 255;

      // Overall volume
      let volumeSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        volumeSum += dataArray[i];
      }
      const rawVolume = (volumeSum / bufferLength) / 255;

      // Apply smoothing
      const bass = prevBassRef.current * smoothing + rawBass * (1 - smoothing);
      const mids = prevMidsRef.current * smoothing + rawMids * (1 - smoothing);
      const highs = prevHighsRef.current * smoothing + rawHighs * (1 - smoothing);
      const volume = prevVolumeRef.current * smoothing + rawVolume * (1 - smoothing);

      prevBassRef.current = bass;
      prevMidsRef.current = mids;
      prevHighsRef.current = highs;
      prevVolumeRef.current = volume;

      // Beat detection (kick/bass spike with cooldown)
      const bassDelta = bass - prevBassRef.current;
      beatCooldownRef.current = Math.max(0, beatCooldownRef.current - 1);
      const beat = bassDelta > beatThreshold && beatCooldownRef.current === 0;
      if (beat) {
        beatCooldownRef.current = 10; // ~167ms cooldown at 60fps
      }

      setAnalysisData({
        bass,
        mids,
        highs,
        beat,
        volume,
      });

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, beatThreshold, smoothing]);

  return analysisData;
};
