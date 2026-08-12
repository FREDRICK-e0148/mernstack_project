CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  entity_label text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT DELETE ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can write audit logs" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (public.is_staff_or_admin(auth.uid()) AND actor_id = auth.uid());

CREATE POLICY "Admins can delete audit logs" ON public.audit_logs
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs (entity, entity_id);