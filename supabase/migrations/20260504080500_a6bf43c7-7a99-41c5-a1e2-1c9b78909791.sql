CREATE TABLE public.paid_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_category TEXT NOT NULL,
  plan_duration TEXT NOT NULL,
  plan_price NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_days INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_paid_plans_user_id ON public.paid_plans(user_id);
CREATE INDEX idx_paid_plans_expires_at ON public.paid_plans(expires_at);

ALTER TABLE public.paid_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own paid plans"
ON public.paid_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own paid plans"
ON public.paid_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paid plans"
ON public.paid_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all paid plans"
ON public.paid_plans FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete paid plans"
ON public.paid_plans FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_paid_plans_updated_at
BEFORE UPDATE ON public.paid_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();