/*
  # Fix Complete RLS Policies for Admin Platform

  1. Database Tables
    - Update RLS policies for models, styles, hero_slides tables
    - Allow authenticated users full CRUD access
    - Maintain public read access

  2. Storage Buckets
    - Create and configure storage buckets with proper RLS
    - Allow authenticated users to upload/manage files
    - Allow public read access to files

  3. Security
    - Ensure admin users can perform all operations
    - Maintain security while allowing functionality
*/

-- First, ensure all required storage buckets exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('models', 'models', true),
  ('styles', 'styles', true),
  ('hero', 'hero', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to insert models" ON models;
DROP POLICY IF EXISTS "Allow authenticated users to update models" ON models;
DROP POLICY IF EXISTS "Allow authenticated users to delete models" ON models;
DROP POLICY IF EXISTS "Allow public read access to models" ON models;

DROP POLICY IF EXISTS "Allow authenticated users to insert styles" ON styles;
DROP POLICY IF EXISTS "Allow authenticated users to update styles" ON styles;
DROP POLICY IF EXISTS "Allow authenticated users to delete styles" ON styles;
DROP POLICY IF EXISTS "Allow public read access to styles" ON styles;

DROP POLICY IF EXISTS "Allow authenticated users to insert hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow authenticated users to update hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow authenticated users to delete hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow public read access to hero_slides" ON hero_slides;

DROP POLICY IF EXISTS "Allow authenticated users to insert model_collections" ON model_collections;
DROP POLICY IF EXISTS "Allow authenticated users to update model_collections" ON model_collections;
DROP POLICY IF EXISTS "Allow authenticated users to delete model_collections" ON model_collections;
DROP POLICY IF EXISTS "Allow public read access to model_collections" ON model_collections;

DROP POLICY IF EXISTS "Allow authenticated users to insert model_photos" ON model_photos;
DROP POLICY IF EXISTS "Allow authenticated users to update model_photos" ON model_photos;
DROP POLICY IF EXISTS "Allow authenticated users to delete model_photos" ON model_photos;
DROP POLICY IF EXISTS "Allow public read access to model_photos" ON model_photos;

-- Create new simplified policies for database tables
CREATE POLICY "Enable all operations for authenticated users" ON models
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for everyone" ON models
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON styles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for everyone" ON styles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON hero_slides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for everyone" ON hero_slides
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON model_collections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for everyone" ON model_collections
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON model_photos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for everyone" ON model_photos
  FOR SELECT TO anon, authenticated USING (true);

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads to models bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to styles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to hero bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to all buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from all buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to all buckets" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Allow authenticated users to upload to models bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'models');

CREATE POLICY "Allow authenticated users to upload to styles bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'styles');

CREATE POLICY "Allow authenticated users to upload to hero bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hero');

CREATE POLICY "Allow public read access to all storage"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('models', 'styles', 'hero'));

CREATE POLICY "Allow authenticated users to delete from storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('models', 'styles', 'hero'));

CREATE POLICY "Allow authenticated users to update storage objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('models', 'styles', 'hero'))
  WITH CHECK (bucket_id IN ('models', 'styles', 'hero'));