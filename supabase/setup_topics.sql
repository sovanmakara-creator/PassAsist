-- Create topics table to store writing and speaking questions
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam TEXT NOT NULL,          -- 'ielts_speaking', 'toefl_speaking', 'toeic_speaking', 'toefl_writing', 'toeic_writing', 'ielts_writing'
  part TEXT NOT NULL,          -- e.g. 'part1', 'part2', 'part3', 'independent', 'integrated', 'academic_discussion', 'opinion_essay', 'email' etc.
  prompt_text TEXT NOT NULL,
  image_url TEXT,              -- For diagram/chart descriptions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to topics
CREATE POLICY "Public can view topics" 
  ON public.topics FOR SELECT 
  USING (true);

-- Allow admins to perform all CRUD operations on topics
CREATE POLICY "Admins can manage topics" 
  ON public.topics FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );
