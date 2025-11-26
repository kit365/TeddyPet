package fpt.teddypet.application.dto.request.payments;

import java.util.Map;

/**
 * Common interface for payment gateway callback requests
 * Ensures all payment gateway callbacks can be processed uniformly
 */
public interface PaymentCallbackRequest {
    
    /**
     * Convert callback to map (excluding signature field)
     * Used for hash verification
     * @return Map of parameters for signature calculation
     */
    Map<String, String> toMap();
    
    /**
     * Get transaction reference/ID
     * @return Transaction reference
     */
    String getTransactionRef();
    
    /**
     * Get transaction status
     * @return Status code
     */
    String getTransactionStatus();
    
    /**
     * Get secure hash/signature
     * @return Signature to verify
     */
    String getSecureHash();
}
