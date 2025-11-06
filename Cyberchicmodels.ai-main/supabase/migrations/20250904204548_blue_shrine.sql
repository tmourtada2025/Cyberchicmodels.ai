/*
  # Add missing featured models

  1. Updates
    - Set Freja Madsen as featured and new
    - Set Layal N. as featured and popular
    - Ensure they appear on the main page

  2. Security
    - No changes to existing RLS policies
*/

-- Update Freja Madsen to be featured and new
UPDATE models 
SET 
  is_featured = true,
  is_new = true,
  updated_at = now()
WHERE name = 'Freja Madsen';

-- Update Layal N. to be featured and popular  
UPDATE models 
SET 
  is_featured = true,
  is_popular = true,
  updated_at = now()
WHERE name = 'Layal N.';

-- Verify the updates
SELECT name, is_featured, is_new, is_popular, is_coming_soon 
FROM models 
WHERE name IN ('Freja Madsen', 'Layal N.');