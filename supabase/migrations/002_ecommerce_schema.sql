-- ============================================
-- Cooking with Chipo - Part 3 Migration
-- Run this AFTER 001_initial_schema.sql
-- ============================================

-- ============================================
-- PRODUCTS (Rosella Spices & Merchandise)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL DEFAULT 'spice',
  image_url TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  weight_grams INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT,
  payment_reference TEXT,
  shipping_address TEXT,
  shipping_phone TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AFFILIATE PROGRAM
-- ============================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AFFILIATE REFERRALS
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  referred_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- ============================================
-- CART (Session-based, no auth required)
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, product_id)
);

-- ============================================
-- ANALYTICS / DAILY STATS
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  new_registrations INTEGER DEFAULT 0,
  new_payments INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  new_students INTEGER DEFAULT 0,
  new_orders INTEGER DEFAULT 0,
  order_revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Products: viewable by everyone
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products viewable by everyone" ON products FOR SELECT USING (true);

-- Orders: students see their own
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own orders" ON orders FOR SELECT USING (true);

-- Order Items: linked to orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items viewable by order owner" ON order_items FOR SELECT USING (true);

-- Affiliates: viewable by everyone (public referral codes)
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates viewable by everyone" ON affiliates FOR SELECT USING (true);

-- Affiliate Referrals: affiliate sees their own
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrals viewable by affiliate" ON affiliate_referrals FOR SELECT USING (true);

-- Cart Items: session-based
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cart items by session" ON cart_items FOR ALL USING (true);

-- Daily Stats: admin only
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stats admin only" ON daily_stats FOR SELECT USING (false);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_student ON orders(student_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_affiliates_code ON affiliates(referral_code);
CREATE INDEX idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX idx_cart_session ON cart_items(session_id);

-- ============================================
-- SAMPLE PRODUCTS (Rosella Spices)
-- ============================================
INSERT INTO products (name, description, price, currency, category, stock_quantity, weight_grams)
VALUES 
  ('Rosella Lemon Pepper', 'Premium lemon pepper blend for grilling chicken and fish. Zesty, aromatic, and perfectly balanced.', 3.50, 'USD', 'spice', 100, 50),
  ('Rosella Ginger Spice', 'Warm ginger spice mix perfect for stews, teas, and baking. Made with organic ginger.', 3.50, 'USD', 'spice', 80, 50),
  ('Rosella BBQ Rub', 'Smoky BBQ spice blend for braai and grilling. The secret to Chipo''s famous grilled chicken.', 4.00, 'USD', 'spice', 60, 75),
  ('Rosella All-Purpose Seasoning', 'The ultimate kitchen staple. Use on everything from sadza to salads.', 3.00, 'USD', 'spice', 120, 50),
  ('Chipo''s Apron', 'Branded cooking apron with pocket. One size fits all.', 8.00, 'USD', 'merchandise', 30, NULL),
  ('Recipe Kit: Grilled Chicken', 'All the spices you need for the Grilled Chicken Masterclass in one box.', 12.00, 'USD', 'kit', 25, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTION: Update Daily Stats
-- ============================================
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (date, new_registrations)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (date) DO UPDATE
  SET new_registrations = daily_stats.new_registrations + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on new registrations
DROP TRIGGER IF EXISTS trigger_update_stats ON registrations;
CREATE TRIGGER trigger_update_stats
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats();
