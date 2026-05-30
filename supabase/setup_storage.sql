-- Enable storage RLS policies for pdfs and audio buckets

-- 1. Allow public select access to the "pdfs" and "audio" buckets so signed and public URLs work
DROP POLICY IF EXISTS "Public Read Access pdfs" ON storage.objects;
CREATE POLICY "Public Read Access pdfs"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pdfs' );

DROP POLICY IF EXISTS "Public Read Access audio" ON storage.objects;
CREATE POLICY "Public Read Access audio"
ON storage.objects FOR SELECT
USING ( bucket_id = 'audio' );

-- 2. Allow authenticated admin users to upload/manage files in the "pdfs" bucket
DROP POLICY IF EXISTS "Admins can upload pdfs" ON storage.objects;
CREATE POLICY "Admins can upload pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdfs' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update pdfs" ON storage.objects;
CREATE POLICY "Admins can update pdfs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdfs' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete pdfs" ON storage.objects;
CREATE POLICY "Admins can delete pdfs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdfs' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 3. Allow authenticated admin users to upload/manage files in the "audio" bucket
DROP POLICY IF EXISTS "Admins can upload audio" ON storage.objects;
CREATE POLICY "Admins can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update audio" ON storage.objects;
CREATE POLICY "Admins can update audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete audio" ON storage.objects;
CREATE POLICY "Admins can delete audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
