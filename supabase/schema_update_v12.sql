-- =============================================
-- SQL Update v12: Add detailed user profile fields (Gender, DOB, Detailed Address)
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_house_no TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_subdistrict TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_district TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_province TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zipcode TEXT;
