package fpt.teddypet.application.util;

public final class ImageAltUtil {

    private ImageAltUtil() {
    }

    /**
     * Tạo alt text cho hình ảnh từ tên
     * Mặc định sẽ thêm hậu tố " Logo"
     * 
     * @param name Tên của đối tượng (ví dụ: "Royal Canin")
     * @return Alt text (ví dụ: "Royal Canin Logo")
     */
    public static String generateAltText(String name) {
        return generateAltText(name, " Logo");
    }

    /**
     * Tạo alt text cho hình ảnh từ tên với hậu tố tùy chỉnh
     * 
     * @param name Tên của đối tượng
     * @param suffix Hậu tố cần thêm (ví dụ: " Logo", " Image", " Photo")
     * @return Alt text
     */
    public static String generateAltText(String name, String suffix) {
        if (name == null || name.trim().isEmpty()) {
            return suffix != null ? suffix.trim() : "";
        }
        return name.trim() + (suffix != null ? suffix : "");
    }
}

