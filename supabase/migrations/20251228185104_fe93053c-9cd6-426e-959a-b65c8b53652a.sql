-- Create clinic_settings table for storing deposit and reminder settings
CREATE TABLE public.clinic_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (clinic settings are clinic-wide)
CREATE POLICY "Allow public read access on clinic_settings" 
ON public.clinic_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on clinic_settings" 
ON public.clinic_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access on clinic_settings" 
ON public.clinic_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access on clinic_settings" 
ON public.clinic_settings 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add reminder_sent column to appointments table
ALTER TABLE public.appointments ADD COLUMN reminder_sent boolean NOT NULL DEFAULT false;

-- Insert default settings
INSERT INTO public.clinic_settings (setting_key, setting_value) VALUES
('consultation_deposit', '{"enabled": false, "amount": 100}'::jsonb),
('reminder_settings', '{"enabled": true, "sms_enabled": true, "whatsapp_enabled": false, "minutes_before": 60}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;