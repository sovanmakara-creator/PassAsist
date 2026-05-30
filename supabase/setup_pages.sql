-- Create site pages table for compliance/AdSense legal pages
CREATE TABLE IF NOT EXISTS public.site_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone (public, guests, authenticated) can read pages
DROP POLICY IF EXISTS "Anyone can read site pages" ON public.site_pages;
CREATE POLICY "Anyone can read site pages"
  ON public.site_pages FOR SELECT
  USING (true);

-- Manage policy: Admins can perform insert/update/delete operations
DROP POLICY IF EXISTS "Admins can manage site pages" ON public.site_pages;
CREATE POLICY "Admins can manage site pages"
  ON public.site_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE public.user_roles.id = auth.uid()
      AND public.user_roles.role = 'admin'
    )
  );
