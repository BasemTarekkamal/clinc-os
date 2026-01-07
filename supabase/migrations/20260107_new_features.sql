-- Create reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create child_milestones table for tracking physical and social progress
CREATE TABLE public.child_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL, -- Logical ID to map back to frontend constants (e.g., "0-3_physical_1")
  category TEXT NOT NULL CHECK (category IN ('physical', 'social')),
  age_range TEXT NOT NULL,
  description TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Add RLS policies for child_milestones
ALTER TABLE public.child_milestones ENABLE ROW LEVEL SECURITY;

-- Note: We check child's parent_id via join or assuming child_id belongs to parent
-- For simplicity and performance, we can trust the child_id lookup if our Children RLS is solid, 
-- but explicit checks are better. Here we'll rely on the fact that you can only insert for children you own.

CREATE POLICY "Users can view milestones for their children"
  ON public.child_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_milestones.child_id
      AND c.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert milestones for their children"
  ON public.child_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_id
      AND c.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones for their children"
  ON public.child_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_milestones.child_id
      AND c.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones for their children"
  ON public.child_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_milestones.child_id
      AND c.parent_id = auth.uid()
    )
  );
