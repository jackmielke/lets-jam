import { useRef, useCallback, useEffect } from 'react';

interface MusicMetadata {
  original_bpm: number;
  cue_point_seconds: number;
}

interface UseMusicSyncProps {
  battleBPM: number;
  metadata: MusicMetadata | null;
  audioElement: HTMLAudioElement | null;
  enabled: boolean;
}

export const useMusicSync = ({ battleBPM, metadata, audioElement, enabled }: UseMusicSyncProps) => {
  const syncedRef = useRef(false);

  const calculatePlaybackRate = useCallback(() => {
    if (!metadata) return 1;
    return battleBPM / metadata.original_bpm;
  }, [battleBPM, metadata]);

  const startSyncedPlayback = useCallback(async () => {
    console.log("🎵 startSyncedPlayback() called");
    if (!audioElement || !metadata || !enabled) {
      console.log('❌ Cannot start synced playback:', { audioElement: !!audioElement, metadata: !!metadata, enabled });
      return;
    }

    try {
      console.log("🎵 Setting up audio element for synced playback");
      // Seek to cue point
      audioElement.currentTime = metadata.cue_point_seconds;
      
      // Set playback rate to match battle BPM
      const playbackRate = calculatePlaybackRate();
      audioElement.playbackRate = playbackRate;
      
      console.log('🎵 Starting synced playback:', {
        cuePoint: metadata.cue_point_seconds,
        playbackRate,
        battleBPM,
        originalBPM: metadata.original_bpm
      });
      
      // Start playback
      console.log("🎵 Calling audioElement.play()...");
      await audioElement.play();
      console.log("✅ Audio playback started successfully");
      syncedRef.current = true;
    } catch (error) {
      console.error('❌ Error starting synced playback:', error);
    }
  }, [audioElement, metadata, enabled, battleBPM, calculatePlaybackRate]);

  const stopSyncedPlayback = useCallback(() => {
    console.log("🎵 stopSyncedPlayback() called");
    if (!audioElement) {
      console.log("❌ No audioElement to stop");
      return;
    }
    
    console.log("🛑 Pausing audio and resetting to start");
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.playbackRate = 1;
    syncedRef.current = false;
    console.log("✅ Audio stopped successfully");
  }, [audioElement]);

  const getPlaybackInfo = useCallback(() => {
    if (!metadata) return null;

    const playbackRate = calculatePlaybackRate();
    const adjustedDuration = audioElement ? audioElement.duration / playbackRate : 0;

    return {
      playbackRate,
      originalBPM: metadata.original_bpm,
      battleBPM,
      cuePoint: metadata.cue_point_seconds,
      adjustedDuration
    };
  }, [metadata, audioElement, battleBPM, calculatePlaybackRate]);

  // Reset sync state when enabled changes
  useEffect(() => {
    if (!enabled) {
      syncedRef.current = false;
    }
  }, [enabled]);

  return {
    startSyncedPlayback,
    stopSyncedPlayback,
    getPlaybackInfo,
    isSynced: syncedRef.current
  };
};
