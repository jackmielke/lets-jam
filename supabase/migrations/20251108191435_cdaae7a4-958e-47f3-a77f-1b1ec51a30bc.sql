-- Create table for background music metadata
CREATE TABLE public.background_music_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  original_bpm NUMERIC NOT NULL CHECK (original_bpm > 0 AND original_bpm <= 300),
  musical_key TEXT,
  cue_point_seconds NUMERIC NOT NULL DEFAULT 0 CHECK (cue_point_seconds >= 0),
  duration_seconds NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.background_music_metadata ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can view music metadata)
CREATE POLICY "Anyone can view music metadata" 
ON public.background_music_metadata 
FOR SELECT 
USING (true);

-- Allow public insert/update/delete (or you can restrict this to authenticated users)
CREATE POLICY "Anyone can manage music metadata" 
ON public.background_music_metadata 
FOR ALL
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_background_music_metadata_updated_at
BEFORE UPDATE ON public.background_music_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();