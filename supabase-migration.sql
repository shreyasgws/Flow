-- Supabase Schema Migration for Flow
-- Idempotent — safe to run multiple times.
-- Uses IF NOT EXISTS so existing tables are preserved.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tasks (
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

CREATE TABLE IF NOT EXISTS flow_sections (
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

CREATE TABLE IF NOT EXISTS drift_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manual',
  updated_at_sync BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  content TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now()) * 1000
);

CREATE TABLE IF NOT EXISTS settings (
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

-- Row Level Security (idempotent)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can manage their own tasks') THEN
    CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flow_sections' AND policyname = 'Users can manage their own flow_sections') THEN
    CREATE POLICY "Users can manage their own flow_sections" ON flow_sections FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drift_entries' AND policyname = 'Users can manage their own drift_entries') THEN
    CREATE POLICY "Users can manage their own drift_entries" ON drift_entries FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reflections' AND policyname = 'Users can manage their own reflections') THEN
    CREATE POLICY "Users can manage their own reflections" ON reflections FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can manage their own categories') THEN
    CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'templates' AND policyname = 'Users can manage their own templates') THEN
    CREATE POLICY "Users can manage their own templates" ON templates FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Users can manage their own settings') THEN
    CREATE POLICY "Users can manage their own settings" ON settings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_flow_sections_user_sort ON flow_sections(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_drift_entries_user_created ON drift_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reflections_user_week ON reflections(user_id, week_start);
