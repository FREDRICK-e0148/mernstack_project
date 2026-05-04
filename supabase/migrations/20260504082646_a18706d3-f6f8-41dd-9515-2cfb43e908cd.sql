-- Add status fields to paid_plans
ALTER TABLE public.paid_plans
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Constrain allowed status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'paid_plans_status_check'
  ) THEN
    ALTER TABLE public.paid_plans
      ADD CONSTRAINT paid_plans_status_check
      CHECK (status IN ('active', 'cancelled', 'refunded'));
  END IF;
END $$;

-- Allow admins to update any paid plan (cancel/refund)
DROP POLICY IF EXISTS "Admins can update paid plans" ON public.paid_plans;
CREATE POLICY "Admins can update paid plans"
ON public.paid_plans
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime so user dashboards refresh on cancellation
ALTER TABLE public.paid_plans REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'paid_plans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.paid_plans;
  END IF;
END $$;