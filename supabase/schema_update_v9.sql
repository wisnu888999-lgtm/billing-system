-- =============================================
-- SQL Update v9: Customer Hierarchy (Parent-Child)
-- =============================================

-- เพิ่มคอลัมน์ parent_id เพื่อเชื่อมโยง "สาขาที่เป็นลูกค้าแยก" เข้ากับ "สำนักงานใหญ่"
ALTER TABLE customers ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- สร้าง Index เพื่อความรวดเร็วในการค้นหาลูกข่าย
CREATE INDEX IF NOT EXISTS idx_customers_parent_id ON customers(parent_id);
