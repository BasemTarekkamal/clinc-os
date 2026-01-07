-- Create child_milestones table for tracking physical and social progress
-- This is a fix migration since the previous one seems to have failed or was skipped

CREATE TABLE IF NOT EXISTS public.child_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL, -- Logical ID to map back to frontend constants (e.g., "0-3_physical_1")
  category TEXT NOT NULL CHECK (category IN ('physical', 'social')),
  age_range TEXT NOT NULL,
  description TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for child_milestones
ALTER TABLE public.child_milestones ENABLE ROW LEVEL SECURITY;

-- Note: We check child's parent_id via join or assuming child_id belongs to parent
-- For simplicity and performance, we can trust the child_id lookup if our Children RLS is solid, 
-- but explicit checks are better. Here we'll rely on the fact that you can only insert for children you own.

DROP POLICY IF EXISTS "Users can view milestones for their children" ON public.child_milestones;
CREATE POLICY "Users can view milestones for their children"
  ON public.child_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_milestones.child_id
      AND c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert milestones for their children" ON public.child_milestones;
CREATE POLICY "Users can insert milestones for their children"
  ON public.child_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_id
      AND c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update milestones for their children" ON public.child_milestones;
CREATE POLICY "Users can update milestones for their children"
  ON public.child_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_milestones.child_id
      AND c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete milestones for their children" ON public.child_milestones;
CREATE POLICY "Users can delete milestones for their children"
  ON public.child_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_milestones.child_id
      AND c.parent_id = auth.uid()
    )
  );
