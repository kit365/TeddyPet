package fpt.teddypet.presentation.constants;

public final class ApiConstants {

    private ApiConstants() {
        // Utility class - prevent instantiation
    }

    // Base API path
    public static final String BASE_API = "/api";

    // Auth API base path
    public static final String API_AUTH = BASE_API + "/auth";

    // Product Variant API base path
    public static final String API_PRODUCT_VARIANTS = BASE_API + "/product-variants";

    // Product Brand API base path
    public static final String API_PRODUCT_BRANDS = BASE_API + "/product-brands";

    // Product Tag API base path
    public static final String API_PRODUCT_TAGS = BASE_API + "/product-tags";
}

