-- Drop the existing constraint and add a new one with 'completed' status
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status = ANY (ARRAY['booked'::text, 'arrived'::text, 'in-consultation'::text, 'late'::text, 'no-show'::text, 'completed'::text]));