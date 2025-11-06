/*
  # Create Storage Buckets

  1. Storage Buckets
    - `models` - For model profile images and thumbnails
    - `collections` - For model collection cover images
    - `hero` - For hero carousel background images
    - `styles` - For style/fashion concept images

  2. Security
    - Public read access for all buckets (images need to be viewable)
    - Authenticated upload/update/delete access
    - File size limits and type restrictions
*/

-- Create models bucket for model profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models',
  'models',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create collections bucket for model collection images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'collections',
  'collections',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create hero bucket for hero carousel images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero',
  'hero',
  true,
  104857600, -- 100MB (larger for hero images)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create styles bucket for fashion style images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'styles',
  'styles',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for models bucket
CREATE POLICY "Public read access for models bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'models');

CREATE POLICY "Authenticated users can upload to models bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'models');

CREATE POLICY "Authenticated users can update models bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'models');

CREATE POLICY "Authenticated users can delete from models bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'models');

-- Storage policies for collections bucket
CREATE POLICY "Public read access for collections bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'collections');

CREATE POLICY "Authenticated users can upload to collections bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'collections');

CREATE POLICY "Authenticated users can update collections bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'collections');

CREATE POLICY "Authenticated users can delete from collections bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'collections');

-- Storage policies for hero bucket
CREATE POLICY "Public read access for hero bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hero');

CREATE POLICY "Authenticated users can upload to hero bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hero');

CREATE POLICY "Authenticated users can update hero bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hero');

CREATE POLICY "Authenticated users can delete from hero bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hero');

-- Storage policies for styles bucket
CREATE POLICY "Public read access for styles bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'styles');

CREATE POLICY "Authenticated users can upload to styles bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'styles');

CREATE POLICY "Authenticated users can update styles bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'styles');

CREATE POLICY "Authenticated users can delete from styles bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'styles');