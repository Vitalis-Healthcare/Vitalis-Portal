-- Migration 003: Fix RLS policies for profile reading
-- Run this if profiles are not loading after login

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_all_authenticated" ON profiles 
  FOR SELECT USING (auth.role() = 'authenticated');
