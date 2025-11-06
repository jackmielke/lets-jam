-- Create storage bucket for background music
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-music', 'background-music', true);

-- Create RLS policies for the background-music bucket
CREATE POLICY "Anyone can view background music"
ON storage.objects FOR SELECT
USING (bucket_id = 'background-music');

CREATE POLICY "Anyone can upload background music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'background-music');

CREATE POLICY "Anyone can delete background music"
ON storage.objects FOR DELETE
USING (bucket_id = 'background-music');