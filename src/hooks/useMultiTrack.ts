import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Track, TrackRecording } from '@/types/track';
import { toast } from 'sonner';

export const useMultiTrack = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recordings, setRecordings] = useState<TrackRecording[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tracks from database
  useEffect(() => {
    const loadTracks = async () => {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;
        setTracks((data || []) as Track[]);
      } catch (error) {
        console.error('Error loading tracks:', error);
        toast.error('Failed to load tracks');
      } finally {
        setIsLoading(false);
      }
    };

    loadTracks();
  }, []);

  // Load recordings from database
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const { data, error } = await supabase
          .from('track_recordings')
          .select('*');

        if (error) throw error;
        setRecordings((data || []) as unknown as TrackRecording[]);
      } catch (error) {
        console.error('Error loading recordings:', error);
      }
    };

    loadRecordings();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const tracksChannel = supabase
      .channel('tracks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTracks(prev => [...prev, payload.new as Track]);
        } else if (payload.eventType === 'UPDATE') {
          setTracks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Track : t));
        } else if (payload.eventType === 'DELETE') {
          setTracks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    const recordingsChannel = supabase
      .channel('recordings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'track_recordings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRecordings(prev => [...prev, payload.new as TrackRecording]);
        } else if (payload.eventType === 'UPDATE') {
          setRecordings(prev => prev.map(r => r.id === payload.new.id ? payload.new as TrackRecording : r));
        } else if (payload.eventType === 'DELETE') {
          setRecordings(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tracksChannel);
      supabase.removeChannel(recordingsChannel);
    };
  }, []);

  const addTrack = useCallback(async (instrumentType: Track['instrument_type'] = 'piano') => {
    try {
      const newTrack: Partial<Track> = {
        name: `${instrumentType.charAt(0).toUpperCase() + instrumentType.slice(1)} Track`,
        instrument_type: instrumentType,
        volume: 1.0,
        pan: 0,
        is_muted: false,
        is_soloed: false,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        order_index: tracks.length,
      };

      const { data, error } = await supabase
        .from('tracks')
        .insert(newTrack)
        .select()
        .single();

      if (error) throw error;
      toast.success('Track added');
      return data as Track;
    } catch (error) {
      console.error('Error adding track:', error);
      toast.error('Failed to add track');
    }
  }, [tracks.length]);

  const updateTrack = useCallback(async (trackId: string, updates: Partial<Track>) => {
    try {
      const { error } = await supabase
        .from('tracks')
        .update(updates)
        .eq('id', trackId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating track:', error);
      toast.error('Failed to update track');
    }
  }, []);

  const deleteTrack = useCallback(async (trackId: string) => {
    try {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId);

      if (error) throw error;
      toast.success('Track deleted');
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Failed to delete track');
    }
  }, []);

  const addRecording = useCallback(async (
    trackId: string,
    notes: TrackRecording['notes'],
    startTime: number,
    duration: number,
    bpm: number,
    timingType: 'straight' | 'swing'
  ) => {
    try {
      const { data, error } = await supabase
        .from('track_recordings')
        .insert({
          track_id: trackId,
          notes: notes as any,
          start_time: startTime,
          duration,
          bpm,
          timing_type: timingType,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Recording saved');
      return data as unknown as TrackRecording;
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save recording');
    }
  }, []);

  const deleteRecording = useCallback(async (recordingId: string) => {
    try {
      const { error } = await supabase
        .from('track_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) throw error;
      toast.success('Recording deleted');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    }
  }, []);

  const getRecordingsForTrack = useCallback((trackId: string) => {
    return recordings.filter(r => r.track_id === trackId);
  }, [recordings]);

  return {
    tracks,
    recordings,
    selectedTrackId,
    setSelectedTrackId,
    isLoading,
    addTrack,
    updateTrack,
    deleteTrack,
    addRecording,
    deleteRecording,
    getRecordingsForTrack,
  };
};
