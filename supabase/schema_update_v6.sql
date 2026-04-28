-- =============================================
-- SQL Update v6: Add branch type to customers
-- =============================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS branch_type TEXT DEFAULT 'สำนักงานใหญ่';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS branch_code TEXT;
