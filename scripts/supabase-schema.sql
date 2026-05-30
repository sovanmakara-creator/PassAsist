-- 1. Create a table for user roles (Role-Based Access Control)
CREATE TABLE user_roles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  role text not null check (role in ('admin', 'student')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can read user roles
CREATE POLICY "Anyone can read user_roles"
  ON user_roles FOR SELECT
  USING (true);

-- 2. Create the resources table
CREATE TABLE resources (
  id text primary key,
  title text not null,
  description text not null,
  category text not null, -- 'ielts', 'toefl', 'toeic', 'helpful', etc.
  difficulty text, -- 'beginner', 'intermediate', 'advanced'
  url text not null,
  type text not null, -- 'tips', 'practice', 'mock', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public can read resources
CREATE POLICY "Public can view resources" 
  ON resources FOR SELECT 
  USING (true);

-- Only admins can insert/update/delete resources
CREATE POLICY "Admins can manage resources" 
  ON resources FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- 3. Create the courses table
CREATE TABLE courses (
  id text primary key,
  resource_id text references resources(id) on delete cascade,
  title text not null,
  description text not null,
  pdf_url text not null,
  chapters_json jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public can read courses
CREATE POLICY "Public can view courses" 
  ON courses FOR SELECT 
  USING (true);

-- Only admins can manage courses
CREATE POLICY "Admins can manage courses" 
  ON courses FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- 4. Storage Bucket Setup
-- NOTE: You MUST create a Storage Bucket named 'pdfs' in your Supabase dashboard first!
-- Once created, run these policies for the storage bucket:

-- Allow public read access to PDFs
CREATE POLICY "Public Access to PDFs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pdfs');

-- Allow admins to upload PDFs
CREATE POLICY "Admins can upload PDFs" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'pdfs' AND 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
