-- Create patients table
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female')),
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone TEXT,
    chronic_conditions TEXT[] DEFAULT ARRAY[]::text[],
    allergies TEXT[] DEFAULT ARRAY[]::text[],
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visits table for medical history
CREATE TABLE public.visits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    chief_complaint TEXT,
    diagnosis TEXT,
    notes TEXT,
    bp_systolic INTEGER,
    bp_diastolic INTEGER,
    weight DECIMAL(5,2),
    temperature DECIMAL(4,1),
    heart_rate INTEGER,
    status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,
    drug_name_ar TEXT,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical_files table for lab results and x-rays
CREATE TABLE public.medical_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    category TEXT DEFAULT 'other' CHECK (category IN ('lab-result', 'x-ray', 'prescription', 'report', 'other')),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add patient_id to appointments table
ALTER TABLE public.appointments ADD COLUMN patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- Create public access policies
CREATE POLICY "Public read patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Public insert patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update patients" ON public.patients FOR UPDATE USING (true);
CREATE POLICY "Public delete patients" ON public.patients FOR DELETE USING (true);

CREATE POLICY "Public read visits" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Public insert visits" ON public.visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update visits" ON public.visits FOR UPDATE USING (true);
CREATE POLICY "Public delete visits" ON public.visits FOR DELETE USING (true);

CREATE POLICY "Public read prescriptions" ON public.prescriptions FOR SELECT USING (true);
CREATE POLICY "Public insert prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update prescriptions" ON public.prescriptions FOR UPDATE USING (true);
CREATE POLICY "Public delete prescriptions" ON public.prescriptions FOR DELETE USING (true);

CREATE POLICY "Public read medical_files" ON public.medical_files FOR SELECT USING (true);
CREATE POLICY "Public insert medical_files" ON public.medical_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update medical_files" ON public.medical_files FOR UPDATE USING (true);
CREATE POLICY "Public delete medical_files" ON public.medical_files FOR DELETE USING (true);

-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', true);

-- Storage policies
CREATE POLICY "Public read medical files" ON storage.objects FOR SELECT USING (bucket_id = 'medical-files');
CREATE POLICY "Public upload medical files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-files');
CREATE POLICY "Public delete medical files" ON storage.objects FOR DELETE USING (bucket_id = 'medical-files');

-- Create triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();