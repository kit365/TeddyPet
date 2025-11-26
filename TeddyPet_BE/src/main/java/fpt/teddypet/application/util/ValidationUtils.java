package fpt.teddypet.application.util;

import java.util.function.BooleanSupplier;

/**
 * Validation utility class to reduce boilerplate validation code across services.
 * Provides common validation patterns for uniqueness checks and business rules.
 */
public final class ValidationUtils {

    private ValidationUtils() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Ensures uniqueness by checking if an entity already exists.
     * Throws IllegalArgumentException if the entity exists.
     *
     * @param existsFunction Function that returns true if entity already exists
     * @param message        Error message to throw if entity exists
     * @throws IllegalArgumentException if entity already exists
     */
    public static void ensureUnique(BooleanSupplier existsFunction, String message) {
        if (existsFunction.getAsBoolean()) {
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * Ensures a business rule condition is met.
     * Throws IllegalArgumentException if condition is false.
     *
     * @param condition Business rule condition to check
     * @param message   Error message to throw if condition is false
     * @throws IllegalArgumentException if condition is not met
     */
    public static void ensure(boolean condition, String message) {
        if (!condition) {
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * Ensures a value is not null.
     *
     * @param value   Value to check
     * @param message Error message to throw if value is null
     * @throws IllegalArgumentException if value is null
     */
    public static void ensureNotNull(Object value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * Ensures a string is not null or blank.
     *
     * @param value   String to check
     * @param message Error message to throw if string is null or blank
     * @throws IllegalArgumentException if string is null or blank
     */
    public static void ensureNotBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
