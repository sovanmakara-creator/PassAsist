-- Create evaluations table to store writing feedback
CREATE TABLE public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam TEXT NOT NULL,
  task TEXT NOT NULL,
  essay TEXT NOT NULL,
  feedback JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) - we use the service role key to insert, 
-- but this secures the table from unauthorized client access.
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Allow public inserts if you want clients to insert directly later (optional)
-- CREATE POLICY "Enable insert for all users" ON "public"."evaluations" FOR INSERT WITH CHECK (true);

-- Allow public read access (optional, if you want users to fetch evaluations)
-- CREATE POLICY "Enable read access for all users" ON "public"."evaluations" FOR SELECT USING (true);
