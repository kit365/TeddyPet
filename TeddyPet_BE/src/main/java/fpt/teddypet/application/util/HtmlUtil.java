package fpt.teddypet.application.util;

import java.util.regex.Pattern;

public final class HtmlUtil {
    private static final Pattern HTML_PATTERN = Pattern.compile("<[^>]*>");

    private HtmlUtil() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Remove all HTML tags from a string.
     */
    public static String stripHtml(String html) {
        if (html == null) {
            return "";
        }
        return HTML_PATTERN.matcher(html).replaceAll("").trim();
    }

    /**
     * Truncate a string to a specific length and add ellipsis if needed.
     */
    public static String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + "...";
    }
}
