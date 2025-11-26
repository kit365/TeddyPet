package fpt.teddypet.application.util;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Utility class for SKU generation and validation
 * SKU Format:
 * - Product (Master): BRAND-CATEGORY-NAME-DATE (e.g., RC-FOOD-CHDOG-221125)
 * - Variant (Derived): PARENT_SKU-ATTR1-ATTR2 (e.g., RC-FOOD-CHDOG-221125-1KG-GA)
 */
public final class SkuUtil {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("ddMMyy");
    private static final int MAX_SKU_LENGTH = 30;

    private SkuUtil() {
        throw new UnsupportedOperationException("Utility class");
    }

    // =========================================================================
    // 1. PRODUCT (MASTER SKU)
    // Format: BRAND-CATEGORY-NAME-DATE
    // Example: RC-FOOD-CHDOG-221125
    // =========================================================================
    
    /**
     * Generate SKU for Product (master/parent)
     * 
     * @param brand Brand name
     * @param category Category name (hoặc material nếu không có category)
     * @param name Product name
     * @return Generated SKU string
     */
    public static String generateProductSku(String brand, String category, String name) {
        StringBuilder sku = new StringBuilder();
        
        // Add brand acronym (limit 3 chars)
        appendPart(sku, generateAcronym(brand, 3));
        
        // Add category acronym (limit 3 chars)
        appendPart(sku, generateAcronym(category, 3));
        
        // Add product name acronym (limit 4 chars)
        appendPart(sku, generateAcronym(name, 4));
        
        // Add date to ensure uniqueness over time
        appendPart(sku, LocalDate.now().format(DATE_FORMAT));
        
        return truncate(sku.toString().toUpperCase());
    }

    // =========================================================================
    // 2. PRODUCT VARIANT (DERIVED SKU)
    // Format: PARENT_SKU-ATTR1-ATTR2
    // Example: RC-FOOD-CHDOG-221125-1KG-GA
    // =========================================================================
    
    /**
     * Generate SKU for ProductVariant (child/derived from parent)
     * 
     * @param parentSku Parent product SKU
     * @param attributes List of attribute values
     * @return Generated variant SKU string
     */
    public static String generateVariantSku(String parentSku, List<String> attributes) {
        if (parentSku == null || parentSku.isBlank()) {
            // Fallback: generate random SKU if parent SKU is missing
            return generateRandomSku();
        }
        
        if (attributes == null || attributes.isEmpty()) {
            // No attributes: add random suffix to differentiate from parent
            return truncate(parentSku + "-" + generateRandomSuffix(3));
        }

        // Build suffix from attributes
        String suffix = attributes.stream()
                .filter(Objects::nonNull)
                .filter(val -> !val.isBlank())
                .map(val -> toSlug(val).toUpperCase())
                .collect(Collectors.joining("-"));

        return truncate(parentSku + "-" + suffix);
    }
    
    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Append part to SKU string with separator
     */
    private static void appendPart(StringBuilder sb, String part) {
        if (part != null && !part.isBlank()) {
            if (sb.length() > 0) {
                sb.append("-");
            }
            sb.append(part.trim());
        }
    }

    /**
     * Generate acronym from input string
     * - For multi-word: take first letter of each word (e.g., "Royal Canin" -> "RC")
     * - For single word: take first N chars (e.g., "Food" -> "FOO")
     * 
     * @param input Input string
     * @param limit Maximum length
     * @return Acronym string
     */
    private static String generateAcronym(String input, int limit) {
        if (input == null || input.isEmpty()) {
            return "GEN";
        }
        
        String normalized = toSlug(input).replace("-", " ");
        String[] words = normalized.split("\\s+");
        
        if (words.length > 1) {
            // Multi-word: take first letter of each word
            String acronym = Arrays.stream(words)
                    .map(w -> w.substring(0, 1))
                    .collect(Collectors.joining(""));
            return acronym.length() > limit ? acronym.substring(0, limit) : acronym;
        }
        
        // Single word: take first N chars
        return input.length() > limit ? input.substring(0, limit) : input;
    }

    /**
     * Convert string to slug format (remove special chars, normalize Vietnamese)
     * Similar to SlugUtil but optimized for SKU generation
     * 
     * @param input Input string
     * @return Slug string
     */
    private static String toSlug(String input) {
        if (input == null) {
            return "";
        }
        
        // Replace whitespace with dash
        String noWhitespace = WHITESPACE.matcher(input).replaceAll("-");
        
        // Normalize Unicode (remove diacritics)
        String normalized = Normalizer.normalize(noWhitespace, Normalizer.Form.NFD);
        
        // Remove non-latin characters
        String slug = NON_LATIN.matcher(normalized).replaceAll("");
        
        // Clean up multiple dashes and trim
        return slug.replaceAll("-+", "-").replaceAll("^-|-$", "");
    }

    /**
     * Truncate SKU to maximum length
     * 
     * @param input Input SKU string
     * @return Truncated string
     */
    private static String truncate(String input) {
        if (input == null) {
            return "";
        }
        if (input.length() <= MAX_SKU_LENGTH) {
            return input;
        }
        return input.substring(0, MAX_SKU_LENGTH);
    }

    /**
     * Generate random suffix for SKU uniqueness
     * 
     * @param length Suffix length
     * @return Random alphanumeric string
     */
    private static String generateRandomSuffix(int length) {
        return UUID.randomUUID().toString().replace("-", "")
                .substring(0, length).toUpperCase();
    }
    
    /**
     * Generate completely random SKU (fallback)
     * 
     * @return Random SKU string
     */
    public static String generateRandomSku() {
        return "PROD-" + generateRandomSuffix(8);
    }
}
