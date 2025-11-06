/*
  # Model Photos and Collections System

  1. New Tables
    - `model_photos` - Individual photos for each model
    - `model_collections` - Photo collections/categories for models
  
  2. Features
    - Up to 15 photos per model
    - Photos can be assigned to collections (Editorial, Casual, Athletic, etc.)
    - Photo captions and metadata
    - Sort ordering for photos
    - Featured photo selection
  
  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users and public read access
    - Foreign key constraints to maintain data integrity
*/

-- Create model_collections table
CREATE TABLE IF NOT EXISTS model_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_image_path text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create model_photos table
CREATE TABLE IF NOT EXISTS model_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES model_collections(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  caption text,
  is_thumbnail boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_model_photos_model_id ON model_photos(model_id);
CREATE INDEX IF NOT EXISTS idx_model_photos_collection_id ON model_photos(collection_id);
CREATE INDEX IF NOT EXISTS idx_model_photos_model_collection ON model_photos(model_id, collection_id);
CREATE INDEX IF NOT EXISTS idx_model_collections_model_id ON model_collections(model_id);

-- Enable Row Level Security
ALTER TABLE model_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for model_collections
CREATE POLICY "Enable read access for everyone" ON model_collections
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON model_collections
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for model_photos
CREATE POLICY "Enable read access for everyone" ON model_photos
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON model_photos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add is_published column to models table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'models' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE models ADD COLUMN is_published boolean DEFAULT false;
  END IF;
END $$;

-- Add specialties array column to models table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'models' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE models ADD COLUMN specialties text[];
  END IF;
END $$;

-- Create index for published models
CREATE INDEX IF NOT EXISTS idx_models_published ON models(is_published);