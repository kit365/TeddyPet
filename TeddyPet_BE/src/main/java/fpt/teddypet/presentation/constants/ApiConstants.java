package fpt.teddypet.presentation.constants;

public final class ApiConstants {

    private ApiConstants() {
        // Utility class - prevent instantiation
    }

    // Base API path
    public static final String BASE_API = "/api";

    // Auth API base path
    public static final String API_AUTH = BASE_API + "/auth";

    // Home API base path (public)
    public static final String API_HOME = BASE_API + "/home";

    // Product Variant API base path
    public static final String API_PRODUCT_VARIANTS = BASE_API + "/product-variants";

    // Product Brand API base path
    public static final String API_PRODUCT_BRANDS = BASE_API + "/product-brands";

    // Product Tag API base path
    public static final String API_PRODUCT_TAGS = BASE_API + "/product-tags";

    // Product Image API base path
    public static final String API_PRODUCT_IMAGES = BASE_API + "/product-images";

    // Product Age Range API base path
    public static final String API_PRODUCT_AGE_RANGES = BASE_API + "/product-age-ranges";

    // Product Category API base path
    public static final String API_PRODUCT_CATEGORIES = BASE_API + "/product-categories";

    // Rating API base path
    public static final String API_RATINGS = BASE_API + "/ratings";

    // Product API base path
    public static final String API_PRODUCTS = BASE_API + "/products";

    // Product Attribute Value API base path
    public static final String API_PRODUCT_ATTRIBUTE_VALUES = BASE_API + "/product-attribute-values";

    // Product Attribute API base path
    public static final String API_PRODUCT_ATTRIBUTES = BASE_API + "/product-attributes";

    // Blog Category API base path
    public static final String API_BLOG_CATEGORIES = BASE_API + "/blog-categories";

    // Blog Post API base path
    public static final String API_BLOG_POSTS = BASE_API + "/blog-posts";

    // Blog Tag API base path
    public static final String API_BLOG_TAGS = BASE_API + "/blog-tags";

    public static final String API_CART = BASE_API + "/carts";

    public static final String API_ORDER = BASE_API + "/orders";

    public static final String API_PROMOTION = BASE_API + "/promotions";
    public static final String PROMOTION_USAGES_BASE = BASE_API + "/promotion-usages";

    public static final String API_PAYMENT = BASE_API + "/payments";

    // User Address API base path
    public static final String API_USER_ADDRESSES = BASE_API + "/user-addresses";

    // Shipping API base path
    public static final String API_SHIPPING = BASE_API + "/shipping";

    // App Setting API base path
    public static final String API_SETTINGS = BASE_API + "/settings";

    // User API base path
    public static final String API_USER = BASE_API + "/users";

    public static final String API_FEEDBACKS = BASE_API + "/feedbacks";

    // OTP API base path
    public static final String API_OTP = BASE_API + "/otp";

    // Service API base paths
    public static final String API_SERVICES = BASE_API + "/services";
    public static final String API_SERVICE_CATEGORIES = BASE_API + "/service-categories";
    public static final String API_SERVICE_COMBOS = BASE_API + "/service-combos";
    public static final String API_SERVICE_PRICINGS = BASE_API + "/service-pricings";

    // Admin Work Shifts API base path
    public static final String API_ADMIN_WORK_SHIFTS = BASE_API + "/admin/work-shifts";

    // Shop / Schedule API base paths
    public static final String API_TIME_SLOT_EXCEPTIONS = BASE_API + "/time-slot-exceptions";
    public static final String API_SHOP_OPERATION_HOURS = BASE_API + "/shop-operation-hours";
    public static final String API_TIME_SLOTS = BASE_API + "/time-slots";

    // Room management
    public static final String API_ROOM_TYPES = BASE_API + "/room-types";
    public static final String API_ROOMS = BASE_API + "/rooms";
    public static final String API_ROOM_BLOCKINGS = BASE_API + "/room-blockings";
    public static final String API_ROOM_LAYOUT_CONFIGS = BASE_API + "/room-layout-configs";

    // Amenities (for room / room-type dropdowns)
    public static final String API_AMENITY_CATEGORIES = BASE_API + "/amenity-categories";
    public static final String API_AMENITIES = BASE_API + "/amenities";

    // Pet profiles (user's pets - dashboard)
    public static final String API_PET_PROFILES = BASE_API + "/pet-profiles";

    // Bookings (client + admin)
    /** Public client booking APIs (tạo booking, tra cứu theo mã...) */
    public static final String API_BOOKINGS = BASE_API + "/bookings";
    /** Admin booking management APIs */
    public static final String API_ADMIN_BOOKINGS = BASE_API + "/admin/bookings";

}
