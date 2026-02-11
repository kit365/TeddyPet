package fpt.teddypet.application.constants.email;

public final class EmailLogMessages {

    private EmailLogMessages() {
    }

    public static final String LOG_SEND_ORDER_EMAIL = "Sending order confirmation email for order {} to {}";
    public static final String LOG_NO_RECIPIENT = "Cannot send order email: No recipient found for order {}";
    public static final String LOG_EMAIL_SENT_SUCCESS = "Email sent successfully to: {}";
    public static final String LOG_EMAIL_SENT_FAILED = "Failed to send email to: {}";
    public static final String LOG_HTML_EMAIL_SENT_SUCCESS = "HTML email sent successfully to: {}";
    public static final String LOG_HTML_EMAIL_SENT_FAILED = "Failed to send HTML email to: {}";
    public static final String LOG_SEND_PASSWORD_RESET = "Sending password reset email to: {}";
    public static final String LOG_SEND_VERIFICATION = "Sending verification email to: {}";
    public static final String LOG_SEND_GUEST_OTP = "Sending guest order OTP to: {}";
    public static final String LOG_SEND_SECURITY_OTP = "Sending security OTP to: {}";
}
