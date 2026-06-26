-- =============================================
-- SQL Update v10: Daily Sales Records & Tracking
-- =============================================

-- ตารางสำหรับเก็บยอดขายรายวันแยกตามช่องทาง
CREATE TABLE IF NOT EXISTS daily_sales_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_date DATE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('regular', 'kol', 'claim')),
    platform TEXT CHECK (platform IN ('tiktok', 'shopee', 'lazada', 'page', 'others', 'claim')),
    qty INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- ป้องกันการลงบันทึกซ้ำซ้อนในวัน/สินค้า/ช่องทางเดียวกัน
    UNIQUE(sale_date, product_id, category, platform)
);

-- Index สำหรับการดึงข้อมูลรายงาน
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales_records(sale_date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_product ON daily_sales_records(product_id);

-- Trigger สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_sales_updated_at
    BEFORE UPDATE ON daily_sales_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
