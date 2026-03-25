package fpt.teddypet.domain.exception;

import jakarta.persistence.EntityNotFoundException;

/**
 * Exception thrown when a requested resource is not found.
 */
public class ResourceNotFoundException extends EntityNotFoundException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
