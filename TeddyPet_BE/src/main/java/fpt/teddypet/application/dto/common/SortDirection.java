package fpt.teddypet.application.dto.common;

/**
 * Enum định nghĩa hướng sort (dùng chung cho tất cả các entity)
 */
public enum SortDirection {
    ASC,
    DESC;

    /**
     * Parse từ string (case-insensitive)
     * Trả về DESC nếu không hợp lệ (default)
     */
    public static SortDirection fromString(String direction) {
        if (direction == null || direction.trim().isEmpty()) {
            return DESC; // Default
        }
        try {
            return valueOf(direction.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return DESC; // Default fallback
        }
    }
}

