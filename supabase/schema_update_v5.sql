-- =============================================
-- SQL Update v5: Add backup phone to customers
-- =============================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_backup TEXT;
