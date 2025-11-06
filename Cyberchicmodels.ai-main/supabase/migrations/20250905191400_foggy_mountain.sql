/*
  # Add Multiple Specialties Support

  1. Changes
    - Add `specialties` array column to models table
    - Keep existing `specialty` column for backward compatibility
    - Update existing data to use array format

  2. Security
    - No RLS changes needed (inherits existing policies)
*/

-- Add new specialties array column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'models' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE models ADD COLUMN specialties text[];
  END IF;
END $$;

-- Migrate existing specialty data to specialties array
UPDATE models 
SET specialties = ARRAY[specialty] 
WHERE specialty IS NOT NULL AND (specialties IS NULL OR array_length(specialties, 1) IS NULL);

-- Set empty array for models with no specialty
UPDATE models 
SET specialties = ARRAY[]::text[] 
WHERE specialties IS NULL;