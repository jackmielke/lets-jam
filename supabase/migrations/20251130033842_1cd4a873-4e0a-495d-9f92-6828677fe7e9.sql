-- Create tracks table for multi-track timeline
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID, -- For future project management
  user_id UUID,
  name TEXT NOT NULL DEFAULT 'New Track',
  instrument_type TEXT NOT NULL DEFAULT 'piano', -- piano, drums, synth, organ, guitar, audio
  volume NUMERIC NOT NULL DEFAULT 1.0,
  pan NUMERIC NOT NULL DEFAULT 0, -- -1 (left) to 1 (right)
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_soloed BOOLEAN NOT NULL DEFAULT false,
  color TEXT NOT NULL DEFAULT '#3b82f6', -- Visual color for track
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create track recordings table to store recorded performances
CREATE TABLE public.track_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  notes JSONB NOT NULL, -- Array of recorded notes with timestamps
  start_time NUMERIC NOT NULL DEFAULT 0, -- Start position in seconds on timeline
  duration NUMERIC NOT NULL, -- Duration in seconds
  bpm NUMERIC NOT NULL,
  timing_type TEXT NOT NULL DEFAULT 'straight',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracks
CREATE POLICY "Anyone can view tracks" 
ON public.tracks 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert tracks" 
ON public.tracks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tracks" 
ON public.tracks 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete tracks" 
ON public.tracks 
FOR DELETE 
USING (true);

-- RLS Policies for track_recordings
CREATE POLICY "Anyone can view recordings" 
ON public.track_recordings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert recordings" 
ON public.track_recordings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update recordings" 
ON public.track_recordings 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete recordings" 
ON public.track_recordings 
FOR DELETE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_tracks_project_id ON public.tracks(project_id);
CREATE INDEX idx_tracks_order ON public.tracks(order_index);
CREATE INDEX idx_track_recordings_track_id ON public.track_recordings(track_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_tracks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tracks_timestamp
BEFORE UPDATE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_tracks_updated_at();

CREATE TRIGGER update_track_recordings_timestamp
BEFORE UPDATE ON public.track_recordings
FOR EACH ROW
EXECUTE FUNCTION public.update_tracks_updated_at();