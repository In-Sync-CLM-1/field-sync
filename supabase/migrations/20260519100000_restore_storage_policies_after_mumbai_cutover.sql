-- Restore storage.objects RLS policies dropped during the 2026-05-18 Mumbai cutover.
-- Buckets carried over but every policy on storage.objects was gone, so all
-- authenticated uploads to org-logos / visit-photos failed with RLS errors.

-- =====================================================================
-- org-logos  (from 20260210055437)
-- =====================================================================
DROP POLICY IF EXISTS "Organization logos are publicly accessible" ON storage.objects;
CREATE POLICY "Organization logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

DROP POLICY IF EXISTS "Authenticated users can upload org logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload org logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'org-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update org logos" ON storage.objects;
CREATE POLICY "Authenticated users can update org logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'org-logos' AND auth.role() = 'authenticated');

-- =====================================================================
-- visit-photos  (from 20260211073719)
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can upload visit photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload visit photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visit-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view visit photos" ON storage.objects;
CREATE POLICY "Anyone can view visit photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'visit-photos');

DROP POLICY IF EXISTS "Users can delete their own visit photos" ON storage.objects;
CREATE POLICY "Users can delete their own visit photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'visit-photos' AND auth.role() = 'authenticated');
