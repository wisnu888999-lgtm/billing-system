-- =============================================
-- SQL Update v11: Pricing Catalog & History
-- =============================================

-- 1. เพิ่มฟิลด์สำหรับเก็บราคาส่งและราคาขายปลีกในตาราง products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_6 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_12 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_20 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS retail_price NUMERIC DEFAULT 0;

-- 2. สร้างตารางสำหรับเก็บประวัติการเปลี่ยนราคา
CREATE TABLE IF NOT EXISTS product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- ราคาเดิม
    old_price NUMERIC,
    old_price_6 NUMERIC,
    old_price_12 NUMERIC,
    old_price_20 NUMERIC,
    old_retail_price NUMERIC,
    
    -- ราคาใหม่
    new_price NUMERIC,
    new_price_6 NUMERIC,
    new_price_12 NUMERIC,
    new_price_20 NUMERIC,
    new_retail_price NUMERIC,
    
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES users(id) -- ใครเป็นคนเปลี่ยน (อาจจะส่งมาจาก API)
);

-- 3. สร้าง Trigger Function สำหรับบันทึกประวัติการเปลี่ยนราคาอัตโนมัติ
CREATE OR REPLACE FUNCTION log_product_price_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- เช็คว่ามีการเปลี่ยนราคาในฟิลด์ใดฟิลด์หนึ่งหรือไม่
    IF (OLD.price IS DISTINCT FROM NEW.price) OR 
       (OLD.price_6 IS DISTINCT FROM NEW.price_6) OR 
       (OLD.price_12 IS DISTINCT FROM NEW.price_12) OR 
       (OLD.price_20 IS DISTINCT FROM NEW.price_20) OR 
       (OLD.retail_price IS DISTINCT FROM NEW.retail_price) THEN
       
       -- ถ้ามีการเปลี่ยน ให้ Insert ข้อมูลลงตาราง history
       INSERT INTO product_price_history (
           product_id, 
           old_price, old_price_6, old_price_12, old_price_20, old_retail_price,
           new_price, new_price_6, new_price_12, new_price_20, new_retail_price,
           changed_at
       ) VALUES (
           NEW.id,
           OLD.price, OLD.price_6, OLD.price_12, OLD.price_20, OLD.retail_price,
           NEW.price, NEW.price_6, NEW.price_12, NEW.price_20, NEW.retail_price,
           NOW()
       );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. ผูก Trigger เข้ากับตาราง products
DROP TRIGGER IF EXISTS trigger_log_price_change ON products;
CREATE TRIGGER trigger_log_price_change
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION log_product_price_changes();
