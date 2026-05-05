-- ==========================================
-- RELOAD E-COMMERCE SUPABASE SETUP
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  category TEXT, -- Fallback / Simplified field
  stock_quantity INTEGER DEFAULT 10,
  sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
  is_trending BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USERS (PROFILES) TABLE
-- To be used in conjunction with Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT,
  customer_email TEXT,
  phone_number TEXT,
  shipping_address TEXT,
  zip_code TEXT,
  payment_method TEXT DEFAULT 'COD',
  total_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 6. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 7. NEWSLETTER TABLE
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CART TABLE (Optional: For syncing across devices)
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_item_id TEXT NOT NULL, -- Format: product_id-size
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_url TEXT,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cart_item_id)
);

-- ==========================================
-- STORAGE POLICIES
-- ==========================================
-- (Existing storage policy comments)

-- ==========================================
-- RLS POLICIES (DATABASE)
-- ==========================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS
CREATE POLICY "Public Products Read" ON products FOR SELECT USING (true);
CREATE POLICY "Public Categories Read" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow Newsletter Signup" ON newsletter FOR INSERT WITH CHECK (true);

-- AUTHENTICATED ACCESS
CREATE POLICY "Users can view own profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cart" ON cart FOR ALL USING (auth.uid() = user_id);
