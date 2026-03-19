-- Initialized data: tạo 1 layout 10x10 cho mỗi dịch vụ có is_required_room = true mà chưa có layout nào.
INSERT INTO room_layout_config (layout_name, max_rows, max_cols, background_image, status, service_id, created_at, updated_at)
SELECT
    'Layout 10x10 - ' || COALESCE(s.service_name, 'Dịch vụ #' || s.id),
    10,
    10,
    NULL,
    'NO_ROOMS_IS_SORTED',
    s.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM services s
WHERE s.is_required_room = true
  AND NOT EXISTS (
    SELECT 1 FROM room_layout_config rlc WHERE rlc.service_id = s.id
  );
