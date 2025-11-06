/*
  # Update Photo Collections System

  1. Changes
    - Update model_photos table to link to collections
    - Add collection_id foreign key
    - Update existing photos to work with new system
    - Add indexes for better performance

  2. New Structure
    - Photos can be assigned to specific collections
    - Collections organize photos by theme/specialty
    - Each model can have multiple collections
    - Each collection can have multiple photos
*/

-- Add collection_id to model_photos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'model_photos' AND column_name = 'collection_id'
  ) THEN
    ALTER TABLE model_photos ADD COLUMN collection_id uuid REFERENCES model_collections(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the foreign key constraint name for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'model_photos' AND constraint_name = 'model_photos_model_id_fkey'
  ) THEN
    ALTER TABLE model_photos DROP CONSTRAINT model_photos_model_id_fkey;
    ALTER TABLE model_photos ADD CONSTRAINT model_photos_model_id_fkey 
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_model_photos_collection_id ON model_photos(collection_id);
CREATE INDEX IF NOT EXISTS idx_model_photos_model_collection ON model_photos(model_id, collection_id);

-- Update RLS policies for model_photos
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON model_photos;
DROP POLICY IF EXISTS "Enable read access for everyone" ON model_photos;

CREATE POLICY "Enable all operations for authenticated users" ON model_photos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for everyone" ON model_photos
  FOR SELECT TO anon, authenticated USING (true);