package fpt.teddypet.application.util;

import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.domain.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.UUID;

/**
 * Utility class for accessing Spring Security context information
 * Provides convenient methods to get current authenticated user details
 */
public final class SecurityUtil {

    private SecurityUtil() {
        // Utility class - prevent instantiation
    }

    /**
     * Get the ID of the currently authenticated user
     * 
     * @return User ID (UUID)
     * @throws IllegalStateException if user is not authenticated or cannot be
     *                               determined
     */
    public static UUID getCurrentUserId() {
        User user = getCurrentUserEntity();
        return user.getId();
    }

    /**
     * Get the email of the currently authenticated user
     * 
     * @return User email
     * @throws IllegalStateException if user is not authenticated
     */
    public static String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException(AuthMessages.MESSAGE_USER_NOT_AUTHENTICATED);
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }

        throw new IllegalStateException(AuthMessages.MESSAGE_CANNOT_DETERMINE_USER);
    }

    /**
     * Get the current authenticated User entity
     * 
     * @return User entity
     * @throws IllegalStateException if user is not authenticated or cannot be
     *                               determined
     */
    public static User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException(AuthMessages.MESSAGE_USER_NOT_AUTHENTICATED);
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }

        throw new IllegalStateException(AuthMessages.MESSAGE_CANNOT_DETERMINE_USER);
    }

    /**
     * Check if there is a currently authenticated user
     * 
     * @return true if user is authenticated, false otherwise
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof User;
    }

    /**
     * Get the ID of the currently authenticated user, or null if not authenticated
     * 
     * @return User ID (UUID) or null if guest/not authenticated
     */
    public static UUID getCurrentUserIdOrNull() {
        if (!isAuthenticated()) {
            return null;
        }
        try {
            return getCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Get the username of the currently authenticated user
     * 
     * @return Username
     * @throws IllegalStateException if user is not authenticated
     */
    public static String getCurrentUsername() {
        User user = getCurrentUserEntity();
        return user.getUsername();
    }
}
