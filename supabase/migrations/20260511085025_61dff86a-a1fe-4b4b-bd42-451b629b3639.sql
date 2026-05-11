
CREATE TABLE public.contact_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','call')),
  user_id UUID,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a contact click"
  ON public.contact_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view contact clicks"
  ON public.contact_clicks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_contact_clicks_channel_created ON public.contact_clicks (channel, created_at DESC);
