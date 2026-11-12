CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  schedule_mode text NOT NULL DEFAULT 'datas' CHECK (schedule_mode IN ('datas','semana')),
  weekdays smallint[] NOT NULL DEFAULT '{}',
  start_date date,
  start_time time,
  end_date date,
  end_time time,
  banner_path text NOT NULL DEFAULT '',
  video_path text NOT NULL DEFAULT '',
  banner_in_carousel boolean NOT NULL DEFAULT false,
  video_in_carousel boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities public read" ON public.activities FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "activities admin insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "activities admin update" ON public.activities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "activities admin delete" ON public.activities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));