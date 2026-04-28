-- SQL script to upgrade products table constraints
-- รันสคริปต์นี้ใน SQL Editor ของ Supabase

-- 1. ปลดข้อจำกัดของประเภทและขนาด เพื่อให้กรอกข้อมูลได้อย่างอิสระ
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_animal_type_check;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_size_check;

-- 2. เพิ่มคอลัมน์สำหรับเก็บรูปภาพต้นฉบับเต็มขนาด (Full resolution original image)
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_image_url TEXT;

-- หมายเหตุ: คำสั่งนี้จะไม่กระทบกับข้อมูลเดิมที่มีอยู่
