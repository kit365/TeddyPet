-- Loại hợp đồng: FULL_TIME (toàn thời gian), PART_TIME (bán thời gian)
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT 'FULL_TIME';

COMMENT ON COLUMN contracts.contract_type IS 'Loại hợp đồng: FULL_TIME, PART_TIME';
