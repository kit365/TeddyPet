-- Restart payment_order_code_seq at 5000000 to avoid collisions with previous PayOS transactions in local environments
ALTER SEQUENCE payment_order_code_seq RESTART WITH 5000000;
