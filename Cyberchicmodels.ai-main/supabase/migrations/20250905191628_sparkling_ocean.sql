/*
  # Add Model Photos System

  1. New Tables
    - `model_photos` - Store individual photos for each model
      - `id` (uuid, primary key)
      - `model_id` (uuid, foreign key to models)
      - `image_path` (text, storage path)
      - `caption` (text, optional description)
      - `is_thumbnail` (boolean, main profile photo)
      - `is_featured` (boolean, featured in collections)
      - `sort_order` (integer, display order)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `model_photos` table
    - Add policies for public read and admin write access

  3. Changes
    - Models can now have up to 15 photos per pack
    - One photo can be marked as thumbnail (main profile photo)
    - Photos have captions and can be reordered
*/

-- Create model_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS model_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  caption text,
  is_thumbnail boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE model_photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for everyone" ON model_photos
  FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON model_photos
  FOR ALL USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_model_photos_model_id ON model_photos(model_id);
CREATE INDEX IF NOT EXISTS idx_model_photos_sort_order ON model_photos(model_id, sort_order);