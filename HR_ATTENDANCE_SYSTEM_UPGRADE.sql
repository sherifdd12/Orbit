-- ========================================================
-- HR ATTENDANCE SYSTEM UPGRADE (SECURE & LOCATION AWARE)
-- ========================================================

BEGIN;

-- 1. Extend Projects Table for Geofencing
DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 200; -- Default 200m radius
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Extend Profiles for Device Binding
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bound_device_id TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Extend Attendance Table for Security & Location
DO $$
BEGIN
    -- Location Data
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_lat DECIMAL(10,8);
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_lng DECIMAL(11,8);
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_lat DECIMAL(10,8);
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_lng DECIMAL(11,8);
    
    -- Verification Data
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'manual'; -- manual, facial_recognition
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS liveness_verified BOOLEAN DEFAULT false;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS verification_photo_url TEXT;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS device_id TEXT;
    
    -- Geofence Status
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS is_within_radius BOOLEAN DEFAULT true;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS distance_meters DECIMAL(10,2);
    
    -- Project Reference (Linking attendance to a specific site/project)
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Attendance Reporting View
CREATE OR REPLACE VIEW public.attendance_analytics AS
SELECT 
    e.id as employee_id,
    p.full_name,
    d.name as department,
    COUNT(a.id) FILTER (WHERE a.status = 'Present' OR a.status = 'Late') as total_present,
    COUNT(a.id) FILTER (WHERE a.status = 'Late') as total_late,
    COUNT(a.id) FILTER (WHERE a.status = 'Absent') as total_absent,
    ROUND(AVG(EXTRACT(EPOCH FROM (a.check_out - a.check_in))/3600)::numeric, 2) as avg_hours_per_day
FROM public.employees e
JOIN public.profiles p ON e.profile_id = p.id
LEFT JOIN public.departments d ON e.department_id = d.id
LEFT JOIN public.attendance a ON e.id = a.employee_id
GROUP BY e.id, p.full_name, d.name;

COMMIT;
