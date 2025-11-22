-- Migration: Add featured, new, and popular columns to models table
-- Created: 2025-01-22
-- Purpose: Add columns to support filtering and tagging models by category on home page

-- Add missing columns if they don't exist
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;

-- Update thumbnail_path values to match uploaded filenames in model-thumbnails bucket
-- These updates will map model names to their corresponding image files
UPDATE models SET thumbnail_path = 'Aria0.webp' WHERE LOWER(name) LIKE '%aria%' AND thumbnail_path IS NOT NULL;
UPDATE models SET thumbnail_path = 'Nova0.webp' WHERE LOWER(name) LIKE '%nova%' AND thumbnail_path IS NOT NULL;
UPDATE models SET thumbnail_path = 'Freja0.webp' WHERE LOWER(name) LIKE '%freja%' AND thumbnail_path IS NOT NULL;
UPDATE models SET thumbnail_path = 'Luna0.webp' WHERE LOWER(name) LIKE '%luna%' AND thumbnail_path IS NOT NULL;
UPDATE models SET thumbnail_path = 'Zara0.webp' WHERE LOWER(name) LIKE '%zara%' AND thumbnail_path IS NOT NULL;
UPDATE models SET thumbnail_path = 'Iris0.webp' WHERE LOWER(name) LIKE '%iris%' AND thumbnail_path IS NOT NULL;
UPDATE models SET thumbnail_path = 'Sage0.webp' WHERE LOWER(name) LIKE '%sage%' AND thumbnail_path IS NOT NULL;
UPDATE models SET thumbnail_path = 'Mira0.webp' WHERE LOWER(name) LIKE '%mira%' AND thumbnail_path IS NOT NULL;
UPDATE models SET thumbnail_path = 'Lyra0.webp' WHERE LOWER(name) LIKE '%lyra%' AND thumbnail_path IS NOT NULL;

-- Mark first 3 models (by creation date) as featured
UPDATE models SET is_featured = TRUE WHERE id IN (SELECT id FROM models ORDER BY created_at DESC LIMIT 3);

-- Set status flags for models (example - adjust as needed)
-- Mark some as new
UPDATE models SET is_new = TRUE WHERE id IN (SELECT id FROM models ORDER BY created_at DESC LIMIT 2 OFFSET 3);

-- Mark some as popular
UPDATE models SET is_popular = TRUE WHERE id IN (SELECT id FROM models ORDER BY created_at DESC LIMIT 2 OFFSET 5);

-- Publish all models so they appear on the site
UPDATE models SET is_published = TRUE WHERE is_published IS NULL OR is_published = FALSE;
