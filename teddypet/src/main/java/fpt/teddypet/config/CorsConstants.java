package fpt.teddypet.config;

import java.util.List;

/**
 * Constants for CORS configuration
 */
public final class CorsConstants {

    private CorsConstants() {
        // Utility class - prevent instantiation
    }

    public static final List<String> ALLOWED_ORIGINS = List.of(
            "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:5173",
            "http://localhost:4173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "https://teddypet.vercel.app"
    );

    public static final List<String> ALLOWED_METHODS = List.of(
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
    );
}

