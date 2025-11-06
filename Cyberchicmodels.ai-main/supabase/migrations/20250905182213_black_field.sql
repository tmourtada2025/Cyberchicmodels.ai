/*
  # Fix Admin RLS Policies

  1. Security Updates
    - Update RLS policies to allow authenticated users to insert/update/delete
    - Ensure admin operations work properly
    - Maintain public read access for frontend
*/

-- Update models table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert models" ON models;
DROP POLICY IF EXISTS "Allow authenticated users to update models" ON models;
DROP POLICY IF EXISTS "Allow authenticated users to delete models" ON models;

CREATE POLICY "Allow authenticated users to insert models"
  ON models
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update models"
  ON models
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete models"
  ON models
  FOR DELETE
  TO authenticated
  USING (true);

-- Update styles table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert styles" ON styles;
DROP POLICY IF EXISTS "Allow authenticated users to update styles" ON styles;
DROP POLICY IF EXISTS "Allow authenticated users to delete styles" ON styles;

CREATE POLICY "Allow authenticated users to insert styles"
  ON styles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update styles"
  ON styles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete styles"
  ON styles
  FOR DELETE
  TO authenticated
  USING (true);

-- Update hero_slides table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow authenticated users to update hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow authenticated users to delete hero_slides" ON hero_slides;

CREATE POLICY "Allow authenticated users to insert hero_slides"
  ON hero_slides
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update hero_slides"
  ON hero_slides
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete hero_slides"
  ON hero_slides
  FOR DELETE
  TO authenticated
  USING (true);

-- Update model_collections table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert model_collections" ON model_collections;
DROP POLICY IF EXISTS "Allow authenticated users to update model_collections" ON model_collections;
DROP POLICY IF EXISTS "Allow authenticated users to delete model_collections" ON model_collections;

CREATE POLICY "Allow authenticated users to insert model_collections"
  ON model_collections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update model_collections"
  ON model_collections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete model_collections"
  ON model_collections
  FOR DELETE
  TO authenticated
  USING (true);

-- Update model_photos table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert model_photos" ON model_photos;
DROP POLICY IF EXISTS "Allow authenticated users to update model_photos" ON model_photos;
DROP POLICY IF EXISTS "Allow authenticated users to delete model_photos" ON model_photos;

CREATE POLICY "Allow authenticated users to insert model_photos"
  ON model_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update model_photos"
  ON model_photos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete model_photos"
  ON model_photos
  FOR DELETE
  TO authenticated
  USING (true);