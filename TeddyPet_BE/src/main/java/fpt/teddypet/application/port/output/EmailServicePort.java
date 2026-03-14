package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.Order;

public interface EmailServicePort {

    void sendEmail(String to, String subject, String body);

    void sendHtmlEmail(String to, String subject, String htmlBody);

    void sendBookingConfirmation(String to, Object bookingDetails);

    void sendOrderConfirmation(String to, Object orderDetails);

    void sendBookingPendingDepositEmail(String to, String bookingCode);

    void sendBookingDepositReminderEmail(String to, String bookingCode);

    void sendBookingDepositSuccessEmail(String to, String bookingCode);

    void sendBookingCancelledEmail(String to, String bookingCode);

    void sendBookingRefundRequestedEmail(String to, String bookingCode, String refundAmount);

    void sendBookingDepositExpiredEmail(String to, String bookingCode);

    /**
     * Send email when admin approves refund
     * 
     * @param to            recipient email
     * @param bookingCode   the booking code
     * @param refundAmount  the approved refund amount
     */
    void sendBookingRefundApprovedEmail(String to, String bookingCode, String refundAmount);

    /**
     * Send password reset email with reset link
     * 
     * @param to         recipient email
     * @param resetToken the reset token
     * @param resetLink  the full reset link
     */
    void sendPasswordResetEmail(String to, String resetToken, String resetLink);

    /**
     * Send email verification link
     * 
     * @param to    recipient email
     * @param token the verification token
     * @param link  the full verification link
     */
    void sendVerificationEmail(String to, String token, String link);

    /**
     * Send OTP for guest order verification
     * 
     * @param to  recipient email
     * @param otp the OTP code
     */
    void sendGuestOrderOtp(String to, String otp);

    /**
     * Send OTP for member security actions (e.g. change password)
     * 
     * @param to  recipient email
     * @param otp the OTP code
     */
    void sendSecurityOtp(String to, String otp);

    /**
     * Send admin invitation link
     *
     * @param to recipient email
     * @param link the full invitation link
     */
    void sendAdminInvitationEmail(String to, String link);

    /**
     * Send order confirmation email with full details
     * 
     * @param order The order entity
     */
    void sendOrderConfirmation(Order order);
}
