# Database Setup Guide

## Supabase Database Setup

The KitchenWise app requires several database tables to function properly. Currently, the app uses fallback data when the database is not set up, but for full functionality, you'll need to create the following tables in your Supabase project.

### Required Tables

1. **ingredient_canonical** - Master list of ingredients
2. **pantry_items** - User's pantry inventory
3. **recipes** - Recipe database
4. **recipe_ingredients** - Ingredients for each recipe
5. **receipts** - Receipt scan history
6. **receipt_line_items** - Individual items from receipts
7. **users** - User accounts and preferences

### Quick Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL commands:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ingredient_canonical table
CREATE TABLE ingredient_canonical (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  synonyms TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('protein', 'vegetable', 'grain', 'oil', 'dairy', 'fruit', 'spice', 'other')),
  default_unit TEXT NOT NULL,
  density NUMERIC,
  shelf_life_defaults JSONB NOT NULL DEFAULT '{"room": 0, "fridge": 0, "freezer": 0}',
  nutrition_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  auth_provider TEXT,
  preferences JSONB NOT NULL DEFAULT '{"units": "metric", "diet": [], "cuisines": [], "allergens": [], "equipment": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pantry_items table
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ingredient_canonical_id UUID NOT NULL REFERENCES ingredient_canonical(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  storage TEXT NOT NULL CHECK (storage IN ('room', 'fridge', 'freezer')),
  expiry_at TIMESTAMP WITH TIME ZONE,
  source TEXT NOT NULL CHECK (source IN ('receipt', 'manual')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  steps TEXT[] NOT NULL,
  yields INTEGER NOT NULL,
  time INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  image_url TEXT,
  url TEXT,
  author TEXT,
  nutrition JSONB NOT NULL DEFAULT '{"calories": 0, "protein": 0, "fat": 0, "carbs": 0}',
  source TEXT NOT NULL CHECK (source IN ('imported', 'user', 'community')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe_ingredients table
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_canonical_id UUID NOT NULL REFERENCES ingredient_canonical(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  optional BOOLEAN DEFAULT FALSE,
  substitutions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ocr_status TEXT NOT NULL CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  parse_status TEXT NOT NULL CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
  confidence_summary JSONB NOT NULL DEFAULT '{"overall": 0, "items": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create receipt_line_items table
CREATE TABLE receipt_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  name_canonical_id UUID REFERENCES ingredient_canonical(id) ON DELETE SET NULL,
  quantity NUMERIC,
  unit TEXT,
  size_text TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0,
  parsed_name TEXT,
  parsed_quantity NUMERIC,
  parsed_unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX idx_pantry_items_ingredient_id ON pantry_items(ingredient_canonical_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_canonical_id);
CREATE INDEX idx_receipt_line_items_receipt_id ON receipt_line_items(receipt_id);
CREATE INDEX idx_receipt_line_items_name_canonical_id ON receipt_line_items(name_canonical_id);

-- Insert some sample data
INSERT INTO ingredient_canonical (name, synonyms, category, default_unit, shelf_life_defaults) VALUES
('Tomato', ARRAY['tomatoes', 'roma tomato'], 'vegetable', 'piece', '{"room": 7, "fridge": 14, "freezer": 180}'),
('Chicken Breast', ARRAY['chicken', 'poultry'], 'protein', 'piece', '{"room": 0, "fridge": 3, "freezer": 270}'),
('Pasta', ARRAY['spaghetti', 'penne'], 'grain', 'cup', '{"room": 365, "fridge": 365, "freezer": 365}'),
('Olive Oil', ARRAY['extra virgin olive oil'], 'oil', 'tablespoon', '{"room": 730, "fridge": 730, "freezer": 730}');

-- Insert a sample recipe
INSERT INTO recipes (title, cuisine, steps, yields, time, difficulty, nutrition, source) VALUES
('Simple Tomato Pasta', 'Italian', ARRAY[
  'Boil water and cook pasta according to package instructions',
  'Dice tomatoes and sauté in olive oil',
  'Combine pasta with tomato sauce',
  'Season with salt and pepper to taste'
], 4, 20, 'Easy', '{"calories": 400, "protein": 12, "fat": 8, "carbs": 70}', 'imported');

-- Insert recipe ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_canonical_id, quantity, unit)
SELECT 
  r.id,
  i.id,
  4,
  'piece'
FROM recipes r, ingredient_canonical i
WHERE r.title = 'Simple Tomato Pasta' AND i.name = 'Tomato';

INSERT INTO recipe_ingredients (recipe_id, ingredient_canonical_id, quantity, unit)
SELECT 
  r.id,
  i.id,
  2,
  'cup'
FROM recipes r, ingredient_canonical i
WHERE r.title = 'Simple Tomato Pasta' AND i.name = 'Pasta';

INSERT INTO recipe_ingredients (recipe_id, ingredient_canonical_id, quantity, unit)
SELECT 
  r.id,
  i.id,
  2,
  'tablespoon'
FROM recipes r, ingredient_canonical i
WHERE r.title = 'Simple Tomato Pasta' AND i.name = 'Olive Oil';
```

### Environment Variables

Make sure your `.env.local` file contains:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Row Level Security (RLS)

For production use, you should also set up Row Level Security policies to ensure users can only access their own data. The current setup uses a demo user ID for simplicity.

### Testing

After setting up the database:

1. Restart your development server
2. The app should now connect to the database successfully
3. You should see real data instead of fallback data
4. All CRUD operations should work properly

### Troubleshooting

If you still see errors:

1. Check that all tables were created successfully
2. Verify your environment variables are correct
3. Check the browser console for specific error messages
4. Ensure your Supabase project is active and not paused

