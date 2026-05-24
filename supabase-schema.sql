-- Supabase Schema for Flow
-- Run this in your Supabase SQL editor to create all tables.

-- Each table has: id (uuid PK), user_id (FK), created_at, updated_at
-- RLS: FOR ALL USING (auth.uid() = user_id)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  flow_section_id UUID,
  category_id UUID,
  date TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER,
  friction_level TEXT,
  focus_window_start TEXT,
  focus_window_end TEXT,
  created_at BIGINT NOT NULL,
  completed_at BIGINT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  source_drift_id TEXT,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE flow_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  atmosphere_color TEXT NOT NULL,
  icon TEXT,
  energy_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE drift_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manual',
  updated_at_sync BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  content TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark',
  environment_mode TEXT NOT NULL DEFAULT 'ambient',
  ambient_intensity TEXT NOT NULL DEFAULT 'subtle',
  motion_preference TEXT NOT NULL DEFAULT 'standard',
  quiet_hours_start TEXT NOT NULL DEFAULT '22:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '07:00',
  day_start_hour INTEGER NOT NULL DEFAULT 4,
  anonymous_onboarding BOOLEAN NOT NULL DEFAULT true,
  daily_nudge_enabled BOOLEAN NOT NULL DEFAULT true,
  focus_window_alerts_enabled BOOLEAN NOT NULL DEFAULT false,
  install_prompt_dismissed BOOLEAN NOT NULL DEFAULT false,
  google_linked BOOLEAN NOT NULL DEFAULT false,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

-- Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own flow_sections"
  ON flow_sections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own drift_entries"
  ON drift_entries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reflections"
  ON reflections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own categories"
  ON categories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own templates"
  ON templates FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings"
  ON settings FOR ALL USING (auth.uid() = user_id);

CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  date TEXT NOT NULL,
  started_at BIGINT NOT NULL,
  ended_at BIGINT,
  elapsed_seconds BIGINT NOT NULL DEFAULT 0,
  completed_task_on_exit BOOLEAN NOT NULL DEFAULT false,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own focus_sessions"
  ON focus_sessions FOR ALL USING (auth.uid() = user_id);

-- Add recurrence fields to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_type TEXT NOT NULL DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_base_id UUID;

-- Add carry_forward_dismissed_for to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS carry_forward_dismissed_for TEXT;

-- Indexes
CREATE INDEX idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_flow_sections_user_sort ON flow_sections(user_id, sort_order);
CREATE INDEX idx_drift_entries_user_created ON drift_entries(user_id, created_at);
CREATE INDEX idx_reflections_user_week ON reflections(user_id, week_start);
CREATE INDEX idx_focus_sessions_user_task ON focus_sessions(user_id, task_id);
CREATE INDEX idx_focus_sessions_user_date ON focus_sessions(user_id, date);
