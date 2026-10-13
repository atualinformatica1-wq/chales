ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'finalizado';

CREATE OR REPLACE FUNCTION public.rented_chalet_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT chalet_id FROM public.bookings
  WHERE status::text IN ('pendente','confirmado')
    AND (status::text <> 'pendente' OR expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.rented_chalet_ids() TO anon, authenticated, service_role;