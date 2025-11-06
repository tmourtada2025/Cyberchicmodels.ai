/*
  # Populate tables with sample data and relationships

  1. Sample Data
    - Adds comprehensive model profiles with realistic details
    - Creates style concepts with proper categorization
    - Establishes hero slides for homepage carousel
    - Links model photos to their respective models
    - Creates model collections with organized photo sets

  2. Relationships
    - Links model_photos to models via foreign keys
    - Associates model_collections with specific models
    - Ensures data consistency across all tables

  3. Content Structure
    - Diverse model profiles across ethnicities and specialties
    - Fashion styles ranging from casual to high-end
    - Professional hero slides for marketing
    - Organized photo collections by theme
*/

-- Clear existing data to avoid conflicts
TRUNCATE TABLE model_photos, model_collections, hero_slides, styles, models RESTART IDENTITY CASCADE;

-- Insert Models with comprehensive profiles
INSERT INTO models (
  id, slug, name, tagline, specialty, nationality, ethnicity, gender, age, age_group,
  height, weight, thumbnail_path, is_featured, is_new, is_popular, is_coming_soon,
  bio, hobbies, experience_years, social_media, measurements, price_usd
) VALUES
-- Featured Models
(
  gen_random_uuid(), 'noura-el-amin', 'Noura El-Amin', 
  'Editorial Excellence Meets Cultural Grace',
  'Editorial, High Fashion', 'Egyptian', 'Arab', 'Female', 25, 'Adult',
  '173cm', '63kg', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
  true, false, true, false,
  'Noura brings a unique blend of Middle Eastern elegance and contemporary fashion sensibility to every shoot. With her striking features and natural poise, she excels in both editorial and commercial work.',
  'Photography, Yoga, Cultural dance, Reading poetry',
  4, '{"instagram": "@noura_elamin", "tiktok": "@noura_fashion"}',
  '{"bust": "86cm", "waist": "61cm", "hips": "91cm", "dress_size": "S"}',
  99.00
),
(
  gen_random_uuid(), 'aria-valen', 'Aria Valen',
  'Italian Sophistication Redefined',
  'Editorial, High Fashion', 'Italian', 'Caucasian', 'Female', 27, 'Adult',
  '175cm', '50kg', 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
  true, true, false, false,
  'Aria embodies the timeless elegance of Italian fashion with a modern twist. Her versatility shines in both avant-garde concepts and classic beauty shots.',
  'Swimming, Sports, Travel, Wine tasting',
  6, '{"instagram": "@aria_valen", "linkedin": "aria-valen-model"}',
  '{"bust": "84cm", "waist": "59cm", "hips": "89cm", "dress_size": "XS"}',
  99.00
),
(
  gen_random_uuid(), 'vanessa-riva', 'Vanessa Riva',
  'Commercial Appeal with Runway Edge',
  'Commercial, Runway', 'Italian', 'Caucasian', 'Female', 22, 'Adult',
  '172cm', '49kg', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
  false, false, false, true,
  'Vanessa is the perfect blend of commercial appeal and high-fashion edge. Her dynamic presence makes her ideal for both lifestyle campaigns and runway shows.',
  'Swimming, Photography, Fashion advocacy, Cars',
  3, '{"instagram": "@vanessa_riva", "youtube": "VanessaRivaOfficial"}',
  '{"bust": "82cm", "waist": "58cm", "hips": "87cm", "dress_size": "XS"}',
  99.00
),

-- Diverse International Models
(
  gen_random_uuid(), 'mariia-ivanova', 'Mariia Ivanova',
  'Eastern European Elegance',
  'Commercial, Runway', 'Ukrainian', 'Caucasian', 'Female', 30, 'Adult',
  '172cm', '52kg', 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg',
  false, false, true, false,
  'Mariia brings a sophisticated European aesthetic to every project. Her experience in sustainable fashion makes her a perfect ambassador for eco-conscious brands.',
  'Yoga, Photography, Sustainable fashion advocacy',
  8, '{"instagram": "@mariia_ivanova", "twitter": "@mariia_model"}',
  '{"bust": "85cm", "waist": "60cm", "hips": "90cm", "dress_size": "S"}',
  99.00
),
(
  gen_random_uuid(), 'nova-vion', 'Nova Vion',
  'French Avant-Garde Vision',
  'High Fashion, Avant-garde', 'French', 'Caucasian', 'Female', 24, 'Adult',
  '175cm', '54kg', 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg',
  false, true, false, false,
  'Nova pushes the boundaries of fashion with her fearless approach to avant-garde concepts. Her artistic background brings a unique perspective to every collaboration.',
  'Digital art, Contemporary dance, Fashion design',
  5, '{"instagram": "@nova_vion", "behance": "nova-vion-art"}',
  '{"bust": "86cm", "waist": "62cm", "hips": "92cm", "dress_size": "S"}',
  99.00
),
(
  gen_random_uuid(), 'camila-vega', 'Camila Vega',
  'Latin American Fire',
  'High Fashion, Commercial, Avant-garde', 'Peruvian', 'Latino', 'Female', 29, 'Adult',
  '171cm', '49kg', 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
  false, false, false, false,
  'Camila brings vibrant energy and cultural richness to every shoot. Her versatility across multiple fashion genres makes her a sought-after talent.',
  'Digital creation, Video games, Fashion design',
  7, '{"instagram": "@camila_vega", "tiktok": "@camila_fashion"}',
  '{"bust": "83cm", "waist": "57cm", "hips": "88cm", "dress_size": "XS"}',
  99.00
),
(
  gen_random_uuid(), 'zeina-s', 'Zeina S.',
  'Middle Eastern Mystique',
  'Editorial, Commercial, High Fashion', 'Lebanese', 'Arab', 'Female', 28, 'Adult',
  '170cm', '51kg', 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg',
  false, false, false, false,
  'Zeina combines traditional Middle Eastern beauty with contemporary fashion sensibilities. Her digital creation skills add a modern edge to her modeling portfolio.',
  'Digital creation, Yoga, Photography',
  6, '{"instagram": "@zeina_s_model", "linkedin": "zeina-s-creative"}',
  '{"bust": "84cm", "waist": "59cm", "hips": "89cm", "dress_size": "S"}',
  99.00
),
(
  gen_random_uuid(), 'zofia-wobel', 'Zofia Wobel',
  'Mature Sophistication',
  'Editorial, Commercial', 'Polish', 'Caucasian', 'Female', 40, 'Adult',
  '166cm', '49kg', 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg',
  false, false, false, false,
  'Zofia represents the beauty and confidence that comes with experience. Her mature perspective brings depth and authenticity to every project.',
  'Reading, Yoga, Travel',
  15, '{"instagram": "@zofia_wobel", "facebook": "ZofiaWobelModel"}',
  '{"bust": "85cm", "waist": "61cm", "hips": "90cm", "dress_size": "S"}',
  99.00
),
(
  gen_random_uuid(), 'elara-vey', 'Elara Vey',
  'Nordic Minimalism',
  'Editorial, High Fashion', 'Finnish', 'Caucasian', 'Female', 25, 'Adult',
  '173cm', '49kg', 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
  false, true, false, false,
  'Elara embodies the clean, minimalist aesthetic of Nordic design. Her natural beauty and understated elegance make her perfect for luxury and lifestyle brands.',
  'Photography, Yoga, Nature hiking',
  4, '{"instagram": "@elara_vey", "pinterest": "elara-vey-style"}',
  '{"bust": "82cm", "waist": "58cm", "hips": "87cm", "dress_size": "XS"}',
  99.00
);

-- Insert Styles with comprehensive details
INSERT INTO styles (
  id, slug, name, clothing_type, style_theme, image_path, back_image_path,
  colors, angle, price_usd, description
) VALUES
-- Casual Collection
('ST119', 'white-tank-short-jeans', 'White Tank & Short Jeans', 'Set', 'Casual',
 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg', null,
 ARRAY['White', 'Blue'], 'front', 1.99,
 'A casual white tank top paired with denim shorts, perfect for summer campaigns and lifestyle shoots.'),

('ST120', 'white-wide-leg-jumpsuit', 'White Wide-Leg Jumpsuit', 'Jumpsuit', 'Casual',
 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg', null,
 ARRAY['White'], 'front', 1.99,
 'A white wide-leg jumpsuit with modern cut, ideal for contemporary fashion shoots.'),

('ST118', 'white-pleated-cafe-dress', 'White Pleated Café Dress', 'Dress', 'Casual',
 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg', null,
 ARRAY['White'], 'front', 1.99,
 'A casual white pleated dress perfect for café outings and lifestyle photography.'),

('ST125', 'cream-turtleneck-beige-trousers', 'Cream Turtleneck & Beige Trousers', 'Set', 'Casual',
 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg', null,
 ARRAY['Cream', 'Beige'], 'front', 1.99,
 'A stylish cream turtleneck paired with beige trousers for sophisticated casual wear.'),

('ST124', 'coral-halter-beach-pants', 'Coral Halter & Beach Pants', 'Set', 'Casual',
 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg', null,
 ARRAY['Coral'], 'front', 1.99,
 'A chic coral halter top with matching beach pants for summer and resort wear.'),

('ST11', 'white-linen-beach-set', 'White Linen Beach Pants & Halter Top', 'Set', 'Casual',
 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg', null,
 ARRAY['White'], 'front', 1.99,
 'A comfortable white linen beach set perfect for resort and vacation photography.'),

-- Glam Collection
('ST126', 'emerald-green-satin-dress', 'Emerald Green Satin Dress', 'Dress', 'Glam',
 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg', null,
 ARRAY['Emerald'], 'front', 1.99,
 'A glamorous emerald green satin dress with a sleek silhouette for evening and formal events.'),

('ST111', 'black-faux-leather-mini-dress', 'Black Faux-Leather Mini Dress', 'Dress', 'Glam',
 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg', null,
 ARRAY['Black'], 'front', 1.99,
 'A stylish black faux-leather mini dress perfect for night out and edgy fashion shoots.'),

('ST129', 'navy-off-shoulder-gown', 'Navy Off-Shoulder Gown', 'Dress', 'Glam',
 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg', null,
 ARRAY['Navy'], 'front', 1.99,
 'An elegant navy off-shoulder evening gown for formal events and red carpet occasions.'),

('ST115', 'pink-satin-robe', 'Pink Satin Robe', 'Robe', 'Glam',
 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg', null,
 ARRAY['Pink'], 'front', 1.99,
 'A luxurious pink satin robe perfect for boudoir and intimate fashion photography.'),

('ST128', 'black-satin-wrap-dress-paris', 'Black Satin Wrap Dress (Paris Edition)', 'Dress', 'Glam',
 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg', null,
 ARRAY['Black'], 'front', 1.99,
 'A sophisticated black satin wrap dress with Parisian elegance and timeless appeal.'),

('ST122', 'burnt-orange-boho-maxi-dress', 'Burnt Orange Boho Maxi Dress', 'Dress', 'Casual',
 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg', null,
 ARRAY['Orange'], 'front', 1.99,
 'A burnt orange maxi dress with boho vibes, perfect for festival and bohemian fashion shoots.'),

-- Premium Collection
('ST100', 'midnight-alloy-gown', 'Midnight Alloy Gown', 'Evening Gown', 'Luxury',
 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg',
 ARRAY['Metallic', 'Black'], 'front', 2.99,
 'An asymmetric metallic gown with architectural pleating and a dramatic silhouette for high-fashion editorial work.'),

('ST106', 'obsidian-halo-gown', 'Obsidian Halo Gown', 'Evening Gown', 'Luxury',
 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg',
 ARRAY['Black'], 'front', 2.99,
 'Jet black sculptural gown with a distinctive halo neckline, perfect for luxury campaigns and avant-garde fashion.');

-- Insert Hero Slides for homepage carousel
INSERT INTO hero_slides (
  title, subtitle, description, background_image_path, button_text, button_link, sort_order, is_active
) VALUES
('AI Fashion Models for a Digital World', 'Digital Innovation',
 'Browse and download ready-to-use model packs — for campaigns, content, or training your own AI.',
 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
 'Browse Models', '/models', 1, true),

('Download-Ready Model Packs', 'Complete Packages',
 'Each pack includes 30+ images and short videos — perfect for AI training, mockups, or content creation.',
 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
 'Browse Models', '/models', 2, true),

('Built for Creators, Brands & AI Developers', 'Professional Tools',
 'From designers to marketers, anyone can train or feature their own AI model using our stylish assets.',
 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
 'Browse Models', '/models', 3, true),

('A Continuously Evolving Model Roster', 'Always Fresh',
 'We''re adding new AI-generated models weekly — across categories, ethnicities, and moods.',
 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg',
 'Browse Models', '/models', 4, true);

-- Create model collections and link them to models
DO $$
DECLARE
    model_record RECORD;
    collection_themes TEXT[] := ARRAY['Athletic', 'Beauty & Close ups', 'Casual & Streetwear', 'Cinematic', 'Commercial', 'Editorial & Glam', 'Fashion & Jewelry'];
    theme TEXT;
    collection_id UUID;
BEGIN
    -- For each model, create 2-3 collections
    FOR model_record IN SELECT id, name FROM models LOOP
        -- Create 2-3 collections per model
        FOR i IN 1..2 LOOP
            theme := collection_themes[((random() * array_length(collection_themes, 1))::int % array_length(collection_themes, 1)) + 1];
            
            INSERT INTO model_collections (model_id, name, description, cover_image_path, sort_order)
            VALUES (
                model_record.id,
                model_record.name || ' - ' || theme,
                'A curated collection showcasing ' || model_record.name || ' in ' || theme || ' themed photography.',
                'https://images.pexels.com/photos/' || (1000000 + (random() * 500000)::int) || '/pexels-photo-' || (1000000 + (random() * 500000)::int) || '.jpeg',
                i
            ) RETURNING id INTO collection_id;
            
            -- Add 3-5 photos per collection
            FOR j IN 1..4 LOOP
                INSERT INTO model_photos (model_id, image_path, caption, is_thumbnail, is_featured, sort_order)
                VALUES (
                    model_record.id,
                    'https://images.pexels.com/photos/' || (1000000 + (random() * 500000)::int) || '/pexels-photo-' || (1000000 + (random() * 500000)::int) || '.jpeg',
                    model_record.name || ' in ' || theme || ' style - Photo ' || j,
                    (j = 1), -- First photo is thumbnail
                    (j <= 2), -- First two photos are featured
                    j
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;