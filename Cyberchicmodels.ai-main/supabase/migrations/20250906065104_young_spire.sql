/*
  # Review and Fix Supabase Table Policies

  This migration reviews all existing policies and ensures they are working correctly
  for both authenticated users (admin) and anonymous users (public access).

  ## Tables Reviewed:
  1. hero_slides - Hero carousel content
  2. models - AI model profiles  
  3. model_collections - Photo collections for models
  4. model_photos - Individual photos in collections
  5. styles - Digital fashion styles

  ## Policy Strategy:
  - Anonymous users: READ access to published content
  - Authenticated users: FULL access (admin functionality)
  - Proper RLS enabled on all tables
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON hero_slides;
DROP POLICY IF EXISTS "Enable read access for everyone" ON hero_slides;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON models;
DROP POLICY IF EXISTS "Enable read access for everyone" ON models;

DROP POLICY IF EXISTS "model_collections_auth_delete" ON model_collections;
DROP POLICY IF EXISTS "model_collections_auth_insert" ON model_collections;
DROP POLICY IF EXISTS "model_collections_auth_update" ON model_collections;
DROP POLICY IF EXISTS "model_collections_public_read" ON model_collections;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON model_photos;
DROP POLICY IF EXISTS "model_photos_auth_delete" ON model_photos;
DROP POLICY IF EXISTS "model_photos_auth_insert" ON model_photos;
DROP POLICY IF EXISTS "model_photos_auth_update" ON model_photos;
DROP POLICY IF EXISTS "model_photos_public_read" ON model_photos;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON styles;
DROP POLICY IF EXISTS "Enable read access for everyone" ON styles;

-- HERO_SLIDES policies
CREATE POLICY "hero_slides_public_read"
  ON hero_slides
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "hero_slides_admin_all"
  ON hero_slides
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MODELS policies
CREATE POLICY "models_public_read"
  ON models
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "models_admin_all"
  ON models
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MODEL_COLLECTIONS policies
CREATE POLICY "model_collections_public_read"
  ON model_collections
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM models 
      WHERE models.id = model_collections.model_id 
      AND models.is_published = true
    )
  );

CREATE POLICY "model_collections_admin_all"
  ON model_collections
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MODEL_PHOTOS policies
CREATE POLICY "model_photos_public_read"
  ON model_photos
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM models 
      WHERE models.id = model_photos.model_id 
      AND models.is_published = true
    )
  );

CREATE POLICY "model_photos_admin_all"
  ON model_photos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- STYLES policies
CREATE POLICY "styles_public_read"
  ON styles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "styles_admin_all"
  ON styles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Add indexes for better policy performance
CREATE INDEX IF NOT EXISTS idx_models_published ON models(is_published);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active);
CREATE INDEX IF NOT EXISTS idx_model_photos_model_published ON model_photos(model_id);
CREATE INDEX IF NOT EXISTS idx_model_collections_model_published ON model_collections(model_id);