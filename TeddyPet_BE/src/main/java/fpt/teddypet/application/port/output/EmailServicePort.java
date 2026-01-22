package fpt.teddypet.application.port.output;

 
public interface EmailServicePort {
  
    void sendEmail(String to, String subject, String body);
    

    void sendHtmlEmail(String to, String subject, String htmlBody);
   
    void sendBookingConfirmation(String to, Object bookingDetails);
    

    void sendOrderConfirmation(String to, Object orderDetails);
    
    /**
     * Send password reset email with reset link
     * @param to recipient email
     * @param resetToken the reset token
     * @param resetLink the full reset link
     */
    void sendPasswordResetEmail(String to, String resetToken, String resetLink);

    /**
     * Send email verification link
     * @param to recipient email
     * @param token the verification token
     * @param link the full verification link
     */
    void sendVerificationEmail(String to, String token, String link);
}

