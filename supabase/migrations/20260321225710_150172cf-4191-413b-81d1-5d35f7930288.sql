
CREATE TABLE public.laboratories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view laboratories" ON public.laboratories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert laboratories" ON public.laboratories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update laboratories" ON public.laboratories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete laboratories" ON public.laboratories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert laboratories" ON public.laboratories FOR INSERT TO authenticated WITH CHECK (true);
