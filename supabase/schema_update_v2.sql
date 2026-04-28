-- =============================================
-- SQL Update v2: Roles, Customer Profile/Email, Invoice History
-- =============================================

-- 1. เพิ่ม Role ให้ Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'admin', 'ceo'));

-- 2. เพิ่มข้อมูล Profile และ Email ให้ Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. ตาราง invoice_history (ประวัติการแก้ไขบิล)
CREATE TABLE IF NOT EXISTS invoice_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_history_invoice ON invoice_history(invoice_id);

-- RLS
ALTER TABLE invoice_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon on invoice_history" ON invoice_history FOR ALL USING (true) WITH CHECK (true);
