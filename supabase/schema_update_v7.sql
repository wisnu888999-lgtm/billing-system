-- =============================================
-- SQL Update v7: Expand customer_branches details
-- =============================================

ALTER TABLE customer_branches ADD COLUMN IF NOT EXISTS phone_backup TEXT;
ALTER TABLE customer_branches ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customer_branches ADD COLUMN IF NOT EXISTS address_line TEXT;
ALTER TABLE customer_branches ADD COLUMN IF NOT EXISTS subdistrict TEXT;
ALTER TABLE customer_branches ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE customer_branches ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE customer_branches ADD COLUMN IF NOT EXISTS zipcode TEXT;
