-- =============================================
-- SQL Update v4: Add 'draft' status to invoices
-- =============================================

-- First, drop the old constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Add the new constraint with 'draft' and 'cancelled' (if not already there)
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'draft'));
