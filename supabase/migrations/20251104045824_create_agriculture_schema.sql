/*
  # Smart Agriculture Market Tracker Database Schema

  ## Overview
  Complete database schema for a Pakistani farmers' market tracking application with role-based access control.

  ## Tables Created

  ### 1. profiles
  Extended user profile information linked to auth.users
  - `id` (uuid, FK to auth.users) - User identifier
  - `email` (text) - User email address
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'admin' or 'farmer'
  - `region` (text, optional) - User's region/city for farmers
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. items
  Market items (vegetables and fruits)
  - `id` (uuid, PK) - Item identifier
  - `name` (text) - Item name (e.g., "Tomatoes", "Mangoes")
  - `category` (text) - 'vegetable' or 'fruit'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. prices
  Daily market rates for items
  - `id` (uuid, PK) - Price record identifier
  - `item_id` (uuid, FK) - Reference to items table
  - `price` (decimal) - Price in PKR per kg
  - `date` (date) - Date of the price
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. posts
  Community forum posts
  - `id` (uuid, PK) - Post identifier
  - `user_id` (uuid, FK) - Author reference to auth.users
  - `title` (text) - Post title
  - `content` (text) - Post content/body
  - `created_at` (timestamptz) - Post creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. comments
  Comments on forum posts
  - `id` (uuid, PK) - Comment identifier
  - `post_id` (uuid, FK) - Reference to posts table
  - `user_id` (uuid, FK) - Commenter reference to auth.users
  - `content` (text) - Comment content
  - `created_at` (timestamptz) - Comment creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security (Row Level Security)
  
  ### profiles
  - Users can read all profiles
  - Users can update only their own profile
  
  ### items
  - Everyone can read items
  - Only admins can create, update, or delete items
  
  ### prices
  - Everyone can read prices
  - Only admins can create, update, or delete prices
  
  ### posts
  - Everyone can read posts
  - Authenticated users can create posts
  - Users can update/delete only their own posts
  
  ### comments
  - Everyone can read comments
  - Authenticated users can create comments
  - Users can update/delete only their own comments

  ## Important Notes
  1. All tables use UUIDs as primary keys
  2. Timestamps use timestamptz for timezone awareness
  3. RLS is enabled on all tables for security
  4. Default values are set for timestamps and IDs
  5. Foreign key constraints ensure data integrity
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'farmer')),
  region text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('vegetable', 'fruit')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update items"
  ON items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete items"
  ON items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create prices table
CREATE TABLE IF NOT EXISTS prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  price decimal(10, 2) NOT NULL CHECK (price >= 0),
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, date)
);

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prices"
  ON prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create prices"
  ON prices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update prices"
  ON prices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete prices"
  ON prices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prices_item_date ON prices(item_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);