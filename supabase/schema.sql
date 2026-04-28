-- =============================================
-- ระบบวางบิลสินค้าอุปโภคบริโภค — Database Schema
-- วิธีใช้: Copy SQL นี้ทั้งหมด → ไปที่ Supabase Dashboard → SQL Editor → วาง → Run
-- =============================================

-- 1. ตาราง users (ผู้ใช้งาน)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ตาราง activity_logs (บันทึกกิจกรรม)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ตาราง customers (ลูกค้า/ร้านค้า)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  credit_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ตาราง customer_branches (สาขาของลูกค้า)
CREATE TABLE IF NOT EXISTS customer_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ตาราง products (สินค้า)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  animal_type TEXT NOT NULL CHECK (animal_type IN ('ปู', 'กุ้ง')),
  size TEXT NOT NULL CHECK (size IN ('เล็ก', 'ใหญ่')),
  weight_g INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ตาราง invoices (บิล/ใบวางบิล)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES customer_branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  credit_days INTEGER NOT NULL DEFAULT 30,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  vat_enabled BOOLEAN NOT NULL DEFAULT false,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ตาราง invoice_items (รายการในบิล)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- 8. ตาราง stock_movements (ประวัติการเคลื่อนไหวสต๊อก)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  qty INTEGER NOT NULL,
  ref_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Indexes สำหรับ performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customer_branches_customer ON customer_branches(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(animal_type);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

-- =============================================
-- Row Level Security (RLS) — เปิดให้ทุกคนเข้าถึงได้
-- เพราะระบบนี้ใช้ภายในไม่มี auth แบบ email/password
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตทุก operation สำหรับ anon key (ใช้ภายในองค์กร)
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customer_branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ข้อมูลตัวอย่าง (Optional — ลบได้ถ้าไม่ต้องการ)
-- =============================================
INSERT INTO products (name, animal_type, size, weight_g, price, cost, stock_qty) VALUES
  ('ปูอัดซอง เล็ก 60g', 'ปู', 'เล็ก', 60, 15.00, 8.00, 100),
  ('ปูอัดซอง เล็ก 120g', 'ปู', 'เล็ก', 120, 25.00, 14.00, 80),
  ('ปูอัดซอง ใหญ่ 250g', 'ปู', 'ใหญ่', 250, 45.00, 25.00, 50),
  ('กุ้งซอง เล็ก 60g', 'กุ้ง', 'เล็ก', 60, 18.00, 10.00, 120),
  ('กุ้งซอง เล็ก 120g', 'กุ้ง', 'เล็ก', 120, 30.00, 17.00, 90),
  ('กุ้งซอง ใหญ่ 250g', 'กุ้ง', 'ใหญ่', 250, 55.00, 30.00, 60);
