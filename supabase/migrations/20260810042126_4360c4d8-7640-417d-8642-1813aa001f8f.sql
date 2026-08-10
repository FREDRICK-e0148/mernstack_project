-- staff role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('admin','staff'))
$$;

-- membership plans
CREATE TABLE public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'membership',
  duration_days integer NOT NULL DEFAULT 30,
  fee numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.membership_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_plans TO authenticated;
GRANT ALL ON public.membership_plans TO service_role;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active membership plans" ON public.membership_plans FOR SELECT USING (is_active = true OR public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins can insert membership plans" ON public.membership_plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update membership plans" ON public.membership_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete membership plans" ON public.membership_plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- members
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  photo_url text,
  dob date,
  gender text,
  phone text NOT NULL,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  plan_id uuid REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  membership_start date,
  membership_expiry date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX members_phone_idx ON public.members (phone);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff and admins can view members" ON public.members FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff and admins can create members" ON public.members FOR INSERT TO authenticated WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff and admins can update members" ON public.members FOR UPDATE TO authenticated USING (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- member payments
CREATE SEQUENCE IF NOT EXISTS public.receipt_seq START 1000;
CREATE TABLE public.member_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  receipt_no text NOT NULL UNIQUE DEFAULT ('FSA-' || nextval('public.receipt_seq')::text),
  plan_id uuid REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  plan_name text,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  period_start date,
  period_end date,
  notes text,
  collected_by uuid,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_payments TO authenticated;
GRANT ALL ON public.member_payments TO service_role;
ALTER TABLE public.member_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff and admins can view payments" ON public.member_payments FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff and admins can create payments" ON public.member_payments FOR INSERT TO authenticated WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins can delete payments" ON public.member_payments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- attendance
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_in_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date,
  method text NOT NULL DEFAULT 'phone',
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, check_in_date)
);
GRANT SELECT, INSERT, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff and admins can view attendance" ON public.attendance FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff and admins can record attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins can delete attendance" ON public.attendance FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- organization settings
CREATE TABLE public.org_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL DEFAULT 'Friends Sports Academy',
  pool_info text,
  address text,
  phone text,
  email text,
  receipt_footer text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.org_settings TO authenticated;
GRANT ALL ON public.org_settings TO service_role;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view org settings" ON public.org_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert org settings" ON public.org_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update org settings" ON public.org_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER org_settings_updated_at BEFORE UPDATE ON public.org_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.org_settings (org_name, address, phone, receipt_footer, pool_info)
VALUES ('Friends Sports Academy', '2/1256, Ramapuram, Thiruvalluvar Nagar, Kumudam Nagar, Mugalivakkam, Chennai, Tamil Nadu 600125', '', 'Thank you for training with us!', 'Semi-Olympic pool. Closed on Mondays.');