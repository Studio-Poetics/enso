-- Enso Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Auth Users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  email text,
  name text,
  avatar text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TEAMS
CREATE TABLE teams (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TEAM_MEMBERS (Junction Table)
CREATE TABLE team_members (
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner', 'admin', 'member', 'viewer')) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (team_id, user_id)
);

-- 4. PROJECTS
CREATE TABLE projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  status text DEFAULT 'Idea',
  content jsonb DEFAULT '{}', -- Stores tasks, boardItems, etc. to keep schema flexible
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Teams: Users can see teams they are members of
CREATE POLICY "Team members can view their teams" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update their teams" ON teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Team Members: Users can see team members of teams they belong to
CREATE POLICY "Team members can view team membership" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can manage members" ON team_members
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Projects: Users can see projects from teams they are members of
CREATE POLICY "Team members can view projects" ON projects
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create projects" ON projects
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ) AND owner_id = auth.uid()
  );

CREATE POLICY "Project owners can update projects" ON projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects" ON projects
  FOR DELETE USING (owner_id = auth.uid());

-- Functions and triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();