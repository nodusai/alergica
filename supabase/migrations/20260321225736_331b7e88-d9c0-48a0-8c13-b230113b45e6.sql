
INSERT INTO storage.buckets (id, name, public) VALUES ('laboratory-photos', 'laboratory-photos', true);

CREATE POLICY "Anyone can view lab photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'laboratory-photos');
CREATE POLICY "Authenticated can upload lab photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'laboratory-photos');
