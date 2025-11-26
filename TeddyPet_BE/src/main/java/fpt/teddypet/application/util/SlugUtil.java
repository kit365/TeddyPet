package fpt.teddypet.application.util;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public class SlugUtil {

    private SlugUtil() {
        // Utility class - prevent instantiation
    }

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern MULTIPLE_DASHES = Pattern.compile("-{2,}");

    // Mapping đầy đủ tất cả ký tự tiếng Việt
    private static final Map<String, String> VIETNAMESE_CHAR_MAP = new HashMap<>();

    static {
        // a, á, à, ả, ã, ạ, ă, ắ, ằ, ẳ, ẵ, ặ, â, ấ, ầ, ẩ, ẫ, ậ
        VIETNAMESE_CHAR_MAP.put("á", "a");
        VIETNAMESE_CHAR_MAP.put("à", "a");
        VIETNAMESE_CHAR_MAP.put("ả", "a");
        VIETNAMESE_CHAR_MAP.put("ã", "a");
        VIETNAMESE_CHAR_MAP.put("ạ", "a");
        VIETNAMESE_CHAR_MAP.put("ă", "a");
        VIETNAMESE_CHAR_MAP.put("ắ", "a");
        VIETNAMESE_CHAR_MAP.put("ằ", "a");
        VIETNAMESE_CHAR_MAP.put("ẳ", "a");
        VIETNAMESE_CHAR_MAP.put("ẵ", "a");
        VIETNAMESE_CHAR_MAP.put("ặ", "a");
        VIETNAMESE_CHAR_MAP.put("â", "a");
        VIETNAMESE_CHAR_MAP.put("ấ", "a");
        VIETNAMESE_CHAR_MAP.put("ầ", "a");
        VIETNAMESE_CHAR_MAP.put("ẩ", "a");
        VIETNAMESE_CHAR_MAP.put("ẫ", "a");
        VIETNAMESE_CHAR_MAP.put("ậ", "a");
        VIETNAMESE_CHAR_MAP.put("Á", "A");
        VIETNAMESE_CHAR_MAP.put("À", "A");
        VIETNAMESE_CHAR_MAP.put("Ả", "A");
        VIETNAMESE_CHAR_MAP.put("Ã", "A");
        VIETNAMESE_CHAR_MAP.put("Ạ", "A");
        VIETNAMESE_CHAR_MAP.put("Ă", "A");
        VIETNAMESE_CHAR_MAP.put("Ắ", "A");
        VIETNAMESE_CHAR_MAP.put("Ằ", "A");
        VIETNAMESE_CHAR_MAP.put("Ẳ", "A");
        VIETNAMESE_CHAR_MAP.put("Ẵ", "A");
        VIETNAMESE_CHAR_MAP.put("Ặ", "A");
        VIETNAMESE_CHAR_MAP.put("Â", "A");
        VIETNAMESE_CHAR_MAP.put("Ấ", "A");
        VIETNAMESE_CHAR_MAP.put("Ầ", "A");
        VIETNAMESE_CHAR_MAP.put("Ẩ", "A");
        VIETNAMESE_CHAR_MAP.put("Ẫ", "A");
        VIETNAMESE_CHAR_MAP.put("Ậ", "A");

        // e, é, è, ẻ, ẽ, ẹ, ê, ế, ề, ể, ễ, ệ
        VIETNAMESE_CHAR_MAP.put("é", "e");
        VIETNAMESE_CHAR_MAP.put("è", "e");
        VIETNAMESE_CHAR_MAP.put("ẻ", "e");
        VIETNAMESE_CHAR_MAP.put("ẽ", "e");
        VIETNAMESE_CHAR_MAP.put("ẹ", "e");
        VIETNAMESE_CHAR_MAP.put("ê", "e");
        VIETNAMESE_CHAR_MAP.put("ế", "e");
        VIETNAMESE_CHAR_MAP.put("ề", "e");
        VIETNAMESE_CHAR_MAP.put("ể", "e");
        VIETNAMESE_CHAR_MAP.put("ễ", "e");
        VIETNAMESE_CHAR_MAP.put("ệ", "e");
        VIETNAMESE_CHAR_MAP.put("É", "E");
        VIETNAMESE_CHAR_MAP.put("È", "E");
        VIETNAMESE_CHAR_MAP.put("Ẻ", "E");
        VIETNAMESE_CHAR_MAP.put("Ẽ", "E");
        VIETNAMESE_CHAR_MAP.put("Ẹ", "E");
        VIETNAMESE_CHAR_MAP.put("Ê", "E");
        VIETNAMESE_CHAR_MAP.put("Ế", "E");
        VIETNAMESE_CHAR_MAP.put("Ề", "E");
        VIETNAMESE_CHAR_MAP.put("Ể", "E");
        VIETNAMESE_CHAR_MAP.put("Ễ", "E");
        VIETNAMESE_CHAR_MAP.put("Ệ", "E");

        // i, í, ì, ỉ, ĩ, ị
        VIETNAMESE_CHAR_MAP.put("í", "i");
        VIETNAMESE_CHAR_MAP.put("ì", "i");
        VIETNAMESE_CHAR_MAP.put("ỉ", "i");
        VIETNAMESE_CHAR_MAP.put("ĩ", "i");
        VIETNAMESE_CHAR_MAP.put("ị", "i");
        VIETNAMESE_CHAR_MAP.put("Í", "I");
        VIETNAMESE_CHAR_MAP.put("Ì", "I");
        VIETNAMESE_CHAR_MAP.put("Ỉ", "I");
        VIETNAMESE_CHAR_MAP.put("Ĩ", "I");
        VIETNAMESE_CHAR_MAP.put("Ị", "I");

        // o, ó, ò, ỏ, õ, ọ, ô, ố, ồ, ổ, ỗ, ộ, ơ, ớ, ờ, ở, ỡ, ợ
        VIETNAMESE_CHAR_MAP.put("ó", "o");
        VIETNAMESE_CHAR_MAP.put("ò", "o");
        VIETNAMESE_CHAR_MAP.put("ỏ", "o");
        VIETNAMESE_CHAR_MAP.put("õ", "o");
        VIETNAMESE_CHAR_MAP.put("ọ", "o");
        VIETNAMESE_CHAR_MAP.put("ô", "o");
        VIETNAMESE_CHAR_MAP.put("ố", "o");
        VIETNAMESE_CHAR_MAP.put("ồ", "o");
        VIETNAMESE_CHAR_MAP.put("ổ", "o");
        VIETNAMESE_CHAR_MAP.put("ỗ", "o");
        VIETNAMESE_CHAR_MAP.put("ộ", "o");
        VIETNAMESE_CHAR_MAP.put("ơ", "o");
        VIETNAMESE_CHAR_MAP.put("ớ", "o");
        VIETNAMESE_CHAR_MAP.put("ờ", "o");
        VIETNAMESE_CHAR_MAP.put("ở", "o");
        VIETNAMESE_CHAR_MAP.put("ỡ", "o");
        VIETNAMESE_CHAR_MAP.put("ợ", "o");
        VIETNAMESE_CHAR_MAP.put("Ó", "O");
        VIETNAMESE_CHAR_MAP.put("Ò", "O");
        VIETNAMESE_CHAR_MAP.put("Ỏ", "O");
        VIETNAMESE_CHAR_MAP.put("Õ", "O");
        VIETNAMESE_CHAR_MAP.put("Ọ", "O");
        VIETNAMESE_CHAR_MAP.put("Ô", "O");
        VIETNAMESE_CHAR_MAP.put("Ố", "O");
        VIETNAMESE_CHAR_MAP.put("Ồ", "O");
        VIETNAMESE_CHAR_MAP.put("Ổ", "O");
        VIETNAMESE_CHAR_MAP.put("Ỗ", "O");
        VIETNAMESE_CHAR_MAP.put("Ộ", "O");
        VIETNAMESE_CHAR_MAP.put("Ơ", "O");
        VIETNAMESE_CHAR_MAP.put("Ớ", "O");
        VIETNAMESE_CHAR_MAP.put("Ờ", "O");
        VIETNAMESE_CHAR_MAP.put("Ở", "O");
        VIETNAMESE_CHAR_MAP.put("Ỡ", "O");
        VIETNAMESE_CHAR_MAP.put("Ợ", "O");

        // u, ú, ù, ủ, ũ, ụ, ư, ứ, ừ, ử, ữ, ự
        VIETNAMESE_CHAR_MAP.put("ú", "u");
        VIETNAMESE_CHAR_MAP.put("ù", "u");
        VIETNAMESE_CHAR_MAP.put("ủ", "u");
        VIETNAMESE_CHAR_MAP.put("ũ", "u");
        VIETNAMESE_CHAR_MAP.put("ụ", "u");
        VIETNAMESE_CHAR_MAP.put("ư", "u");
        VIETNAMESE_CHAR_MAP.put("ứ", "u");
        VIETNAMESE_CHAR_MAP.put("ừ", "u");
        VIETNAMESE_CHAR_MAP.put("ử", "u");
        VIETNAMESE_CHAR_MAP.put("ữ", "u");
        VIETNAMESE_CHAR_MAP.put("ự", "u");
        VIETNAMESE_CHAR_MAP.put("Ú", "U");
        VIETNAMESE_CHAR_MAP.put("Ù", "U");
        VIETNAMESE_CHAR_MAP.put("Ủ", "U");
        VIETNAMESE_CHAR_MAP.put("Ũ", "U");
        VIETNAMESE_CHAR_MAP.put("Ụ", "U");
        VIETNAMESE_CHAR_MAP.put("Ư", "U");
        VIETNAMESE_CHAR_MAP.put("Ứ", "U");
        VIETNAMESE_CHAR_MAP.put("Ừ", "U");
        VIETNAMESE_CHAR_MAP.put("Ử", "U");
        VIETNAMESE_CHAR_MAP.put("Ữ", "U");
        VIETNAMESE_CHAR_MAP.put("Ự", "U");

        // y, ý, ỳ, ỷ, ỹ, ỵ
        VIETNAMESE_CHAR_MAP.put("ý", "y");
        VIETNAMESE_CHAR_MAP.put("ỳ", "y");
        VIETNAMESE_CHAR_MAP.put("ỷ", "y");
        VIETNAMESE_CHAR_MAP.put("ỹ", "y");
        VIETNAMESE_CHAR_MAP.put("ỵ", "y");
        VIETNAMESE_CHAR_MAP.put("Ý", "Y");
        VIETNAMESE_CHAR_MAP.put("Ỳ", "Y");
        VIETNAMESE_CHAR_MAP.put("Ỷ", "Y");
        VIETNAMESE_CHAR_MAP.put("Ỹ", "Y");
        VIETNAMESE_CHAR_MAP.put("Ỵ", "Y");

        // đ, Đ
        VIETNAMESE_CHAR_MAP.put("đ", "d");
        VIETNAMESE_CHAR_MAP.put("Đ", "D");
    }

    /**
     * Examples:
     * "Thức ăn cho chó" -> "thuc-an-cho-cho"
     * "Đồ chơi cho mèo" -> "do-choi-cho-meo"
     * "Product Name 123" -> "product-name-123"
     */
    public static String toSlug(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "";
        }

        StringBuilder result = new StringBuilder();
        
        // Xử lý từng ký tự
        for (char c : input.toCharArray()) {
            String charStr = String.valueOf(c);
            if (VIETNAMESE_CHAR_MAP.containsKey(charStr)) {
                result.append(VIETNAMESE_CHAR_MAP.get(charStr));
            } else {
                String normalized = Normalizer.normalize(charStr, Normalizer.Form.NFD);
                String withoutAccents = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
                result.append(withoutAccents);
            }
        }
        
        String processed = result.toString();
        

        String lowercased = processed.toLowerCase(Locale.ENGLISH);
        

        String withHyphens = WHITESPACE.matcher(lowercased).replaceAll("-");
        

        String cleaned = NON_LATIN.matcher(withHyphens).replaceAll("");
        
        cleaned = MULTIPLE_DASHES.matcher(cleaned).replaceAll("-");
        
        // Remove dashes from edges
        if (cleaned.startsWith("-")) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.endsWith("-")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        
        return cleaned;
    }


    public static String generateUniqueSlug(String baseSlug, String[] existingSlugs) {
        String slug = toSlug(baseSlug);
        
        if (existingSlugs == null || existingSlugs.length == 0) {
            return slug;
        }
        
        String uniqueSlug = slug;
        int counter = 1;
        
        while (contains(existingSlugs, uniqueSlug)) {
            uniqueSlug = slug + "-" + counter;
            counter++;
        }
        
        return uniqueSlug;
    }

    private static boolean contains(String[] array, String value) {
        if (array == null) {
            return false;
        }
        for (String item : array) {
            if (item != null && item.equals(value)) {
                return true;
            }
        }
        return false;
    }
}

