-- V26: Add numeric_code column to orders for PayOS compatibility
CREATE SEQUENCE IF NOT EXISTS order_numeric_code_seq START WITH 1000000;
ALTER TABLE orders ADD COLUMN numeric_code BIGINT UNIQUE DEFAULT nextval('order_numeric_code_seq');
