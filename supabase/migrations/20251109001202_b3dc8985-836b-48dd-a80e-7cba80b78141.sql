-- Make user_id nullable so licks can be stored without authentication
ALTER TABLE public.licks ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing restrictive policies that require authentication
DROP POLICY IF EXISTS "Users can view own licks" ON public.licks;
DROP POLICY IF EXISTS "Users can insert own licks" ON public.licks;
DROP POLICY IF EXISTS "Users can update own licks" ON public.licks;
DROP POLICY IF EXISTS "Users can delete own licks" ON public.licks;

-- Create public access policies - anyone can manage licks
CREATE POLICY "Anyone can view licks" ON public.licks
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert licks" ON public.licks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update licks" ON public.licks
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete licks" ON public.licks
  FOR DELETE USING (true);