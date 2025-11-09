-- Add timing_type column to licks table to distinguish between straight and swing time
ALTER TABLE licks 
ADD COLUMN timing_type text NOT NULL DEFAULT 'straight' 
CHECK (timing_type IN ('straight', 'swing'));

-- Add comment for documentation
COMMENT ON COLUMN licks.timing_type IS 'Timing type: straight (16th note subdivisions) or swing (triplet subdivisions)';