-- ============================================
-- Cooking with Chipo - Part 4 Migration
-- Run this AFTER 002_part3_schema.sql
-- ============================================

-- ============================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- SCHEDULED REMINDERS
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  hours_before INTEGER NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CHATBOT CONVERSATIONS LOG
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES students(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  actions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only reminders" ON scheduled_reminders FOR ALL USING (false);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own conversations" ON chatbot_conversations FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_scheduled_reminders_status ON scheduled_reminders(status, scheduled_for);
CREATE INDEX idx_scheduled_reminders_class ON scheduled_reminders(class_id);
CREATE INDEX idx_chatbot_session ON chatbot_conversations(session_id);

-- ============================================
-- FUNCTION: Auto-schedule default reminders for new classes
-- ============================================
CREATE OR REPLACE FUNCTION auto_schedule_class_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- 24 hours before
  INSERT INTO scheduled_reminders (class_id, hours_before, message, channel, scheduled_for)
  VALUES (
    NEW.id,
    24,
    'Hi {name}! Reminder: Your class "' || NEW.title || '" starts in 24 hours. Get your ingredients ready! 🍳',
    'whatsapp',
    NEW.class_date - interval '24 hours'
  );

  -- 1 hour before
  INSERT INTO scheduled_reminders (class_id, hours_before, message, channel, scheduled_for)
  VALUES (
    NEW.id,
    1,
    'Hi {name}! Your class "' || NEW.title || '" starts in 1 hour! Join link will be shared shortly. 🔥',
    'whatsapp',
    NEW.class_date - interval '1 hour'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-schedule reminders when a class is created
DROP TRIGGER IF EXISTS trigger_auto_reminders ON classes;
CREATE TRIGGER trigger_auto_reminders
  AFTER INSERT ON classes
  FOR EACH ROW
  EXECUTE FUNCTION auto_schedule_class_reminders();
