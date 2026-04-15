
-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments"
  ON public.enrollments FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create enrollment_candidates table
CREATE TABLE public.enrollment_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  contact_no TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  photo_url TEXT,
  height TEXT,
  weight TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enrollment_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own candidates"
  ON public.enrollment_candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create candidates for their enrollments"
  ON public.enrollment_candidates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own candidates"
  ON public.enrollment_candidates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own candidates"
  ON public.enrollment_candidates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id AND e.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.enrollment_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-photos', 'candidate-photos', true);

CREATE POLICY "Anyone can view candidate photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-photos');

CREATE POLICY "Authenticated users can upload candidate photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'candidate-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'candidate-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'candidate-photos' AND auth.role() = 'authenticated');
