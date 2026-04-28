-- =============================================
-- SQL Update v8: Profit Tracking (Cost Snapshot)
-- =============================================

-- เพิ่มคอลัมน์ cost_per_unit ในตารางรายการบิล เพื่อบันทึกต้นทุน ณ วันที่ออกบิล
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0;

-- หมายเหตุ: การคำนวณกำไรจะใช้สูตร (price_per_unit - cost_per_unit) * qty
