package fpt.teddypet.application.port.input.auth;

public interface OtpService {
    /**
     * Send OTP to guest email.
     * 
     * @param email guest email
     * @return resend cooldown in seconds
     */
    long sendGuestOtp(String email);

    /**
     * Verify and consume OTP (used when placing order).
     * 
     * @param email guest email
     * @param otp   otp code
     */
    void verifyGuestOtp(String email, String otp);

    /**
     * Check if OTP is valid without consuming it (used for UI validation).
     * 
     * @param email guest email
     * @param otp   otp code
     */
    void validateGuestOtp(String email, String otp);

    /**
     * Send OTP to authenticated member email.
     */
    long sendMemberOtp(String email);
}
