-- Create storage bucket for audio samples
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-samples', 'audio-samples', true);

-- Create table for audio samples
CREATE TABLE public.audio_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_samples ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view samples
CREATE POLICY "Samples are viewable by everyone" 
ON public.audio_samples 
FOR SELECT 
USING (true);

-- Allow anyone to create samples
CREATE POLICY "Anyone can create samples" 
ON public.audio_samples 
FOR INSERT 
WITH CHECK (true);

-- Storage policies for audio samples
CREATE POLICY "Sample files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-samples');

CREATE POLICY "Anyone can upload samples" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-samples');