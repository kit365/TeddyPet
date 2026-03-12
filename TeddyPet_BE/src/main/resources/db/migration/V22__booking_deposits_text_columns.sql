-- Align booking_deposits JSON columns with JPA String mapping by using TEXT type.
DO $$ 
BEGIN
    -- For booking_draft: check if exists and is not already text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_deposits' 
        AND column_name = 'booking_draft' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE booking_deposits ALTER COLUMN booking_draft DROP DEFAULT;
        ALTER TABLE booking_deposits ALTER COLUMN booking_draft TYPE TEXT USING booking_draft::TEXT;
    END IF;

    -- For hold_payload: check if exists and is not already text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_deposits' 
        AND column_name = 'hold_payload' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE booking_deposits ALTER COLUMN hold_payload DROP DEFAULT;
        ALTER TABLE booking_deposits ALTER COLUMN hold_payload TYPE TEXT USING hold_payload::TEXT;
        ALTER TABLE booking_deposits ALTER COLUMN hold_payload SET DEFAULT '{}';
    END IF;
END $$;

