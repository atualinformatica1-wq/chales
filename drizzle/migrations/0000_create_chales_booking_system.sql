-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Company settings (singleton)
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  pix_key text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read company settings"
ON public.company_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update company settings"
ON public.company_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert company settings"
ON public.company_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Chalets
CREATE TABLE public.chalets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  capacity integer NOT NULL DEFAULT 2,
  whatsapp text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chalets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chalets TO authenticated;
GRANT ALL ON public.chalets TO service_role;
ALTER TABLE public.chalets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active chalets"
ON public.chalets FOR SELECT TO anon USING (active = true);
CREATE POLICY "Authenticated can read chalets"
ON public.chalets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage chalets insert"
ON public.chalets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage chalets update"
ON public.chalets FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage chalets delete"
ON public.chalets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Bookings
CREATE TYPE public.booking_status AS ENUM ('pendente', 'confirmado', 'cancelado');

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chalet_id uuid NOT NULL REFERENCES public.chalets(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  nights integer NOT NULL DEFAULT 1,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'pendente',
  notes text NOT NULL DEFAULT '',
  payment_reference text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 hour',
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_slot_idx ON public.bookings (chalet_id, booking_date, status);
GRANT SELECT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read bookings"
ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete bookings"
ON public.bookings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-cancel unpaid bookings after 1 hour
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.bookings
     SET status = 'cancelado', cancelled_at = now(),
         notes = CASE WHEN notes = '' THEN 'Cancelado automaticamente por falta de pagamento' ELSE notes END
   WHERE status = 'pendente' AND expires_at < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Seed company + chalets
INSERT INTO public.company_settings (name, tagline, address, phone, whatsapp, email, pix_key)
VALUES (
  'Chalés Vale das Araucárias',
  'Refúgios de montanha para descansar de verdade',
  'Rua das Hortênsias, 450 - Campos do Jordão, SP',
  '(12) 3663-1200',
  '5512999990000',
  'contato@valedasaraucarias.com.br',
  'contato@valedasaraucarias.com.br'
);

INSERT INTO public.chalets (name, description, price, image_url, capacity, whatsapp, sort_order) VALUES
('Chalé Araucária', 'Chalé de madeira com lareira, varanda com vista para a serra e café da manhã incluso. Ideal para casais que buscam aconchego ao entardecer.', 480.00, '/images/chales/chale-1.jpg', 2, '5512999990000', 1),
('Chalé Névoa', 'Pedra e madeira, banheira de hidromassagem externa aquecida, amplos vidros com vista para o vale. Conforto premium em noites frias.', 890.00, '/images/chales/chale-2.jpg', 4, '5512999990000', 2),
('Chalé Lago', 'Chalé triangular às margens do lago, deck privativo e píer. Perfeito para manhãs silenciosas e pesca esportiva.', 620.00, '/images/chales/chale-3.jpg', 3, '5512999990000', 3),
('Chalé Jardim', 'Espaçoso, dois quartos, varanda gourmet e jardim privativo com churrasqueira. Feito para a família toda.', 750.00, '/images/chales/chale-4.jpg', 6, '5512999990000', 4);
