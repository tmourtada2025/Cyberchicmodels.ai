/*
  # Add Published Status to Models

  1. Changes
    - Add `is_published` boolean field to models table
    - Default to false (unpublished)
    - Add index for better query performance

  2. Security
    - No changes to existing RLS policies
*/

-- Add published status column to models table
ALTER TABLE models ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Add index for better performance when filtering by published status
CREATE INDEX IF NOT EXISTS idx_models_published ON models(is_published);

-- Update existing models to be published by default (optional)
-- UPDATE models SET is_published = true WHERE is_published IS NULL;