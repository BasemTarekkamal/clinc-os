-- Create appointments table for the Live Queue
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT NOT NULL,
    patient_photo TEXT,
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'arrived', 'in-consultation', 'late', 'no-show')),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_fast_track BOOLEAN NOT NULL DEFAULT false,
    arrival_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- For now, allow public read/write access (we'll add auth later)
CREATE POLICY "Allow public read access on appointments" 
ON public.appointments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access on appointments" 
ON public.appointments 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access on appointments" 
ON public.appointments 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for appointments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Insert sample data for demonstration
INSERT INTO public.appointments (patient_name, status, scheduled_time, is_fast_track) VALUES
('أحمد محمود', 'booked', NOW() + INTERVAL '30 minutes', false),
('فاطمة علي', 'arrived', NOW() + INTERVAL '15 minutes', false),
('محمد حسن', 'in-consultation', NOW() - INTERVAL '10 minutes', true),
('سارة إبراهيم', 'late', NOW() - INTERVAL '20 minutes', false),
('يوسف عبدالله', 'booked', NOW() + INTERVAL '1 hour', false),
('نور الدين', 'arrived', NOW() + INTERVAL '45 minutes', true);