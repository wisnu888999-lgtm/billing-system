-- =============================================
-- SQL Update v3: Split Address Fields for Customers
-- =============================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS subdistrict TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zipcode TEXT;

-- (Optional) Populate existing data into address_line if empty
UPDATE customers SET address_line = address WHERE address_line IS NULL;
