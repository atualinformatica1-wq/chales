CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date,
  banner_path text NOT NULL DEFAULT '',
  video_path text NOT NULL DEFAULT '',
  banner_in_carousel boolean NOT NULL DEFAULT false,
  video_in_carousel boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read" ON public.events FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "events admin insert" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "events admin update" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "events admin delete" ON public.events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "event media public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'event-media');
CREATE POLICY "event media admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "event media admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'event-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "event media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-media' AND public.has_role(auth.uid(), 'admin'));