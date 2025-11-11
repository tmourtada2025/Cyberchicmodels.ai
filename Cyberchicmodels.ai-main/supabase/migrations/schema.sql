-- Enable the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- Hero images table
-- Stores the paths of images used in the hero carousel.  You can change
-- display_order to control their order on the page.
CREATE TABLE IF NOT EXISTS hero_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

--
-- Models table
-- Each record represents a model (e.g., Amina, Nova, Mariia).  The
-- thumbnail_path points to the image shown on the models overview page.
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  thumbnail_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

--
-- Model collections table
-- A model can have multiple collections (e.g., "editorial", "runway").  The
-- display_order controls the order of pills in the UI.
CREATE TABLE IF NOT EXISTS model_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES models (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

--
-- Model collection images
-- Images that belong to a model and optionally to a specific collection.
-- If collection_id is NULL, the image is considered part of the model's
-- general set and will be used when no collection is selected.  The
-- display_order can be used to control carousel order.
CREATE TABLE IF NOT EXISTS model_collection_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES models (id) ON DELETE CASCADE,
  collection_id UUID REFERENCES model_collections (id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

--
-- Styles table
-- Each record represents a style or clothing item.  A style can have
-- multiple colors, angles and model variants stored in the style_media table.
CREATE TABLE IF NOT EXISTS styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

--
-- Colors table
-- Defines available color swatches for styles.
CREATE TABLE IF NOT EXISTS colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  hex_code TEXT,
  display_order INTEGER NOT NULL
);

--
-- Angles table
-- Defines angle names for style photos (front, back, side, etc.).  Use
-- display_order to determine ordering in the UI.
CREATE TABLE IF NOT EXISTS angles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

--
-- Style media table
-- Cross‑reference table that links a style to a particular model, angle and
-- color.  Each row represents a single image (or other media) file for a
-- style under a specific combination of model, angle and color.
CREATE TABLE IF NOT EXISTS style_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  style_id UUID NOT NULL REFERENCES styles (id) ON DELETE CASCADE,
  model_id UUID REFERENCES models (id) ON DELETE CASCADE,
  angle_id INTEGER REFERENCES angles (id) ON DELETE CASCADE,
  color_id UUID REFERENCES colors (id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

--
-- Storage bucket setup
-- These buckets will hold media files.  Setting public = TRUE makes them
-- publicly readable via the storage API.  If you prefer one consolidated
-- bucket, you can create a single bucket and manage paths instead.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('hero', 'hero', TRUE),
  ('model-thumbnails', 'model-thumbnails', TRUE),
  ('model-collections', 'model-collections', TRUE),
  ('styles', 'styles', TRUE)
ON CONFLICT (id) DO NOTHING;

--
-- Enable Row Level Security (RLS) and policies for public read access
--
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_collection_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE angles ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_media ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) read access for all tables
-- Drop existing policies if they exist and recreate them without IF NOT EXISTS.
DROP POLICY IF EXISTS hero_images_select ON hero_images;
CREATE POLICY hero_images_select ON hero_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS models_select ON models;
CREATE POLICY models_select ON models
  FOR SELECT USING (true);

DROP POLICY IF EXISTS model_collections_select ON model_collections;
CREATE POLICY model_collections_select ON model_collections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS model_collection_images_select ON model_collection_images;
CREATE POLICY model_collection_images_select ON model_collection_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS styles_select ON styles;
CREATE POLICY styles_select ON styles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS colors_select ON colors;
CREATE POLICY colors_select ON colors
  FOR SELECT USING (true);

DROP POLICY IF EXISTS angles_select ON angles;
CREATE POLICY angles_select ON angles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS style_media_select ON style_media;
CREATE POLICY style_media_select ON style_media
  FOR SELECT USING (true);

-- Optionally, allow authenticated users (or service role) to insert/update
-- Replace 'authenticated' with the appropriate role if you use custom auth.
DROP POLICY IF EXISTS hero_images_insert ON hero_images;
CREATE POLICY hero_images_insert ON hero_images
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS models_insert ON models;
CREATE POLICY models_insert ON models
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS model_collections_insert ON model_collections;
CREATE POLICY model_collections_insert ON model_collections
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS model_collection_images_insert ON model_collection_images;
CREATE POLICY model_collection_images_insert ON model_collection_images
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS styles_insert ON styles;
CREATE POLICY styles_insert ON styles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS colors_insert ON colors;
CREATE POLICY colors_insert ON colors
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS angles_insert ON angles;
CREATE POLICY angles_insert ON angles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS style_media_insert ON style_media;
CREATE POLICY style_media_insert ON style_media
  FOR INSERT WITH CHECK (true);

-- Update policies can be added similarly if needed


