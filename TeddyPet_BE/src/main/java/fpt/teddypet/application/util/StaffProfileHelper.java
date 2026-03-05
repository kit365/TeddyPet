package fpt.teddypet.application.util;

/**
 * Helper cho StaffProfile - phân tách fullName thành firstName và lastName.
 */
public final class StaffProfileHelper {

    private StaffProfileHelper() {
    }

    /**
     * Tách fullName thành [firstName, lastName].
     * Quy tắc: từ đầu đến khoảng trắng cuối cùng = firstName, phần còn lại = lastName.
     * Ví dụ: "Nguyễn Văn A" -> ["Nguyễn Văn", "A"]
     *        "Trần" -> ["Trần", ""]
     *        "" hoặc null -> ["", ""]
     */
    public static String[] splitFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return new String[]{"", ""};
        }
        String trimmed = fullName.trim();
        int lastSpace = trimmed.lastIndexOf(' ');
        if (lastSpace <= 0) {
            return new String[]{trimmed, ""};
        }
        String firstName = trimmed.substring(0, lastSpace).trim();
        String lastName = trimmed.substring(lastSpace + 1).trim();
        return new String[]{firstName, lastName};
    }
}
