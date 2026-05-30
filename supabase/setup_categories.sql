-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id text primary key,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Select policy: public can view categories
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

-- Manage policy: admins can insert/update/delete categories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Seed default categories
INSERT INTO categories (id, name, sort_order) VALUES
  ('ielts', 'IELTS', 1),
  ('toefl', 'TOEFL', 2),
  ('toeic', 'TOEIC', 3),
  ('helpful', 'Helpful Sources', 4),
  ('reading', 'Reading Quiz', 5),
  ('listening', 'Listening Quiz', 6)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;
