/*
  # Fix Models Table Access

  1. Problem
    - All models disappeared after applying RLS policies
    - Current policies may be too restrictive
    - Need to restore proper access to models data

  2. Solution
    - Drop existing restrictive policies
    - Create new policies that allow proper access
    - Ensure published models are visible to public
    - Ensure authenticated users can manage all models

  3. Security
    - Public users can only see published models (is_published = true)
    - Authenticated users have full access for admin functions
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "models_public_read" ON models;
DROP POLICY IF EXISTS "models_admin_all" ON models;
DROP POLICY IF EXISTS "Enable read access for everyone" ON models;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON models;

-- Create new, properly configured policies
CREATE POLICY "models_public_select"
  ON models
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "models_authenticated_all"
  ON models
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Verify the policies are working by checking if we can see models
-- This is just a comment for verification - you can run this in the SQL editor:
-- SELECT COUNT(*) FROM models; -- Should show all models for authenticated users
-- SELECT COUNT(*) FROM models WHERE is_published = true; -- Should show published models for everyone