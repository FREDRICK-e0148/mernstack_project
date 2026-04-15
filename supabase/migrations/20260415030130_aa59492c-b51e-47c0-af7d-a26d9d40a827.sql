
DROP POLICY "Anyone can view candidate photos" ON storage.objects;

CREATE POLICY "Authenticated users can view candidate photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-photos' AND auth.role() = 'authenticated');
