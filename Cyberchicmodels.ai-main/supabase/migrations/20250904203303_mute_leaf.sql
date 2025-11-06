/*
  # Create models and styles tables

  1. New Tables
    - `models`
      - `id` (uuid, primary key)
      - `slug` (text, unique)
      - `name` (text, not null)
      - `tagline` (text)
      - `specialty` (text)
      - `nationality` (text)
      - `ethnicity` (text)
      - `gender` (text)
      - `age` (integer)
      - `age_group` (text)
      - `height` (text)
      - `weight` (text)
      - `thumbnail_path` (text)
      - `is_featured` (boolean, default false)
      - `is_new` (boolean, default false)
      - `is_popular` (boolean, default false)
      - `is_coming_soon` (boolean, default false)
      - `bio` (text)
      - `hobbies` (text)
      - `experience_years` (integer)
      - `social_media` (jsonb)
      - `measurements` (jsonb)
      - `price_usd` (decimal, default 99.00)
      - `created_at` (timestamptz, default now())

    - `styles`
      - `id` (text, primary key)
      - `slug` (text, unique)
      - `name` (text, not null)
      - `clothing_type` (text)
      - `style_theme` (text)
      - `image_path` (text)
      - `back_image_path` (text)
      - `colors` (text array)
      - `angle` (text)
      - `price_usd` (decimal, default 1.99)
      - `description` (text)
      - `created_at` (timestamptz, default now())

    - `model_photos`
      - `id` (uuid, primary key)
      - `model_id` (uuid, foreign key)
      - `image_path` (text, not null)
      - `caption` (text)
      - `is_thumbnail` (boolean, default false)
      - `is_featured` (boolean, default false)
      - `sort_order` (integer, default 0)
      - `created_at` (timestamptz, default now())

    - `hero_slides`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `subtitle` (text)
      - `description` (text)
      - `background_image_path` (text)
      - `button_text` (text, not null)
      - `button_link` (text, not null)
      - `sort_order` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `model_collections`
      - `id` (uuid, primary key)
      - `model_id` (uuid, foreign key)
      - `name` (text, not null)
      - `description` (text)
      - `cover_image_path` (text)
      - `sort_order` (integer, default 0)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (anonymous users can view data)
    - Add policies for authenticated users to manage data

  3. Sample Data
    - Insert sample models and styles to populate the application
*/

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  specialty text,
  nationality text,
  ethnicity text,
  gender text,
  age integer,
  age_group text,
  height text,
  weight text,
  thumbnail_path text,
  is_featured boolean DEFAULT false,
  is_new boolean DEFAULT false,
  is_popular boolean DEFAULT false,
  is_coming_soon boolean DEFAULT false,
  bio text,
  hobbies text,
  experience_years integer,
  social_media jsonb,
  measurements jsonb,
  price_usd decimal(10,2) DEFAULT 99.00,
  created_at timestamptz DEFAULT now()
);

-- Create styles table
CREATE TABLE IF NOT EXISTS styles (
  id text PRIMARY KEY,
  slug text UNIQUE,
  name text NOT NULL,
  clothing_type text,
  style_theme text,
  image_path text,
  back_image_path text,
  colors text[],
  angle text,
  price_usd decimal(10,2) DEFAULT 1.99,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create model_photos table
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

-- Create hero_slides table
CREATE TABLE IF NOT EXISTS hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  background_image_path text,
  button_text text NOT NULL,
  button_link text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Enable Row Level Security
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_collections ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to models"
  ON models
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to styles"
  ON styles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to model_photos"
  ON model_photos
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to hero_slides"
  ON hero_slides
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to model_collections"
  ON model_collections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for authenticated users to manage data
CREATE POLICY "Allow authenticated users to insert models"
  ON models
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update models"
  ON models
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete models"
  ON models
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert styles"
  ON styles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update styles"
  ON styles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete styles"
  ON styles
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert sample data
INSERT INTO models (slug, name, age, nationality, height, weight, specialty, hobbies, gender, ethnicity, is_popular, is_new, is_coming_soon, price_usd) VALUES
('noura-el-amin', 'Noura El-Amin', 25, 'Egyptian', '173cm', '63kg', 'Editorial, High Fashion', 'Photography, Yoga', 'Female', 'Arab', true, false, false, 99.00),
('vanessa-riva', 'Vanessa Riva', 22, 'Italian', '172cm', '49kg', 'Commercial, Runway', 'Swimming, photography, fashion advocacy, cars', 'Female', 'Caucasian', false, false, true, 99.00),
('aria-valen', 'Aria Valen', 27, 'Italian', '175cm', '50kg', 'Editorial, High Fashion', 'Swimming, Sports, Travel', 'Female', 'Caucasian', false, true, false, 99.00)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO styles (id, slug, name, price_usd, description) VALUES
('ST126', 'emerald-green-satin-dress', 'Emerald Green Satin Dress', 1.99, 'A glamorous emerald green satin dress with a sleek silhouette'),
('ST119', 'white-tank-short-jeans', 'White Tank & Short Jeans', 1.99, 'A casual white tank top paired with denim shorts'),
('ST120', 'white-wide-leg-jumpsuit', 'White Wide-Leg Jumpsuit', 1.99, 'A white wide-leg jumpsuit with modern cut'),
('ST118', 'white-pleated-cafe-dress', 'White Pleated Café Dress', 1.99, 'A casual white pleated dress perfect for café outings'),
('ST111', 'black-faux-leather-mini-dress', 'Black Faux-Leather Mini Dress', 1.99, 'A stylish black faux-leather mini dress'),
('ST122', 'burnt-orange-boho-maxi-dress', 'Burnt Orange Boho Maxi Dress', 1.99, 'A burnt orange maxi dress with boho vibes')
ON CONFLICT (id) DO NOTHING;