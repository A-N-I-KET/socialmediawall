-- Create the approved_tweets table
CREATE TABLE public.approved_tweets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tweet_url TEXT NOT NULL,
  tweet_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.approved_tweets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view approved tweets (public gallery)
CREATE POLICY "Anyone can view approved tweets" 
ON public.approved_tweets 
FOR SELECT 
USING (true);

-- Policy: Authenticated users can insert tweets
CREATE POLICY "Authenticated users can insert tweets" 
ON public.approved_tweets 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can delete their own tweets
CREATE POLICY "Users can delete their own tweets" 
ON public.approved_tweets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for live updates on the gallery
ALTER PUBLICATION supabase_realtime ADD TABLE public.approved_tweets;