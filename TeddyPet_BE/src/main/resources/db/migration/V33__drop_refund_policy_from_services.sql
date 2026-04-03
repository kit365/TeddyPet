-- ===== CANCELLATION REFUND PERCENTAGES =====
ALTER TABLE services DROP COLUMN IF EXISTS before_deadline_refund_pct;
ALTER TABLE services DROP COLUMN IF EXISTS after_deadline_refund_pct;

-- ===== NO-SHOW =====
ALTER TABLE services DROP COLUMN IF EXISTS no_show_refund_pct;
ALTER TABLE services DROP COLUMN IF EXISTS no_show_penalty;

-- ===== RESCHEDULE =====
ALTER TABLE services DROP COLUMN IF EXISTS allow_reschedule;
ALTER TABLE services DROP COLUMN IF EXISTS reschedule_deadline_hours;
ALTER TABLE services DROP COLUMN IF EXISTS reschedule_limit;

-- ===== FORCE MAJEURE =====
ALTER TABLE services DROP COLUMN IF EXISTS allow_force_majeure;
ALTER TABLE services DROP COLUMN IF EXISTS force_majeure_refund_pct;
