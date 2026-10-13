CREATE TABLE public.chalet_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chalet_id uuid NOT NULL REFERENCES public.chalets(id) ON DELETE CASCADE,
  guest_name text NOT NULL CHECK (char_length(guest_name) BETWEEN 2 AND 80),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 10 AND 1000),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chalet_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chalet_reviews TO authenticated;
GRANT ALL ON public.chalet_reviews TO service_role;
ALTER TABLE public.chalet_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads approved reviews" ON public.chalet_reviews FOR SELECT TO anon, authenticated USING (status = 'aprovado' OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Public submits pending reviews" ON public.chalet_reviews FOR INSERT TO anon, authenticated WITH CHECK (status = 'pendente' AND EXISTS (SELECT 1 FROM public.chalets WHERE id = chalet_id AND active = true));
CREATE POLICY "Admins update reviews" ON public.chalet_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reviews" ON public.chalet_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX chalet_reviews_visible_idx ON public.chalet_reviews (status, created_at DESC);
CREATE INDEX chalet_reviews_chalet_idx ON public.chalet_reviews (chalet_id);