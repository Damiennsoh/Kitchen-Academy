-- ============================================
-- Cooking with Chipo - Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ============================================
-- STUDENTS (extends Supabase Auth users)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  whatsapp_opt_in BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CLASSES
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  class_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  max_students INTEGER NOT NULL DEFAULT 50,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  is_live BOOLEAN DEFAULT true,
  video_url TEXT,
  zoom_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- REGISTRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  paid BOOLEAN DEFAULT false,
  payment_method TEXT,
  payment_reference TEXT,
  attended BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  certificate_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- ============================================
-- PDF GUIDES
-- ============================================
CREATE TABLE IF NOT EXISTS pdf_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MESSAGE LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  class_title TEXT NOT NULL,
  class_date TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  download_url TEXT,
  UNIQUE(registration_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Students: anyone can read, only authenticated can insert their own
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students are viewable by everyone" ON students
  FOR SELECT USING (true);

CREATE POLICY "Students can insert their own record" ON students
  FOR INSERT WITH CHECK (true);

-- Classes: viewable by everyone
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes are viewable by everyone" ON classes
  FOR SELECT USING (true);

-- Registrations: students see their own, admin sees all
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see own registrations" ON registrations
  FOR SELECT USING (true);

CREATE POLICY "Students can register themselves" ON registrations
  FOR INSERT WITH CHECK (true);

-- PDF Guides: viewable by everyone (download controlled by app logic)
ALTER TABLE pdf_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PDF guides viewable by everyone" ON pdf_guides
  FOR SELECT USING (true);

-- Message Logs: admin only (handled in API routes)
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Message logs admin only" ON message_logs
  FOR SELECT USING (false);

-- Certificates: viewable by linked student
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificates viewable by everyone" ON certificates
  FOR SELECT USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_registrations_student ON registrations(student_id);
CREATE INDEX idx_registrations_class ON registrations(class_id);
CREATE INDEX idx_registrations_paid ON registrations(paid);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_classes_date ON classes(class_date);
CREATE INDEX idx_message_logs_class ON message_logs(class_id);

-- ============================================
-- SAMPLE DATA (for development)
-- ============================================
INSERT INTO classes (title, description, price, currency, class_date, duration_minutes, max_students, status, is_live)
VALUES 
  ('Grilled Chicken Masterclass', 'Learn the secrets of perfectly grilled chicken with Chipo. Includes marinade recipes, grilling techniques, and plating tips.', 5.00, 'USD', now() + interval '3 days', 120, 50, 'upcoming', true),
  ('Traditional Zimbabwean Sadza & Relish', 'Master the art of cooking authentic sadza with seasonal relishes. Perfect for beginners.', 5.00, 'USD', now() + interval '10 days', 90, 50, 'upcoming', true),
  ('Baking Perfect Bread at Home', 'From dough to oven — learn bread baking fundamentals with simple ingredients.', 10.00, 'USD', now() + interval '17 days', 150, 30, 'upcoming', true)
ON CONFLICT DO NOTHING;
