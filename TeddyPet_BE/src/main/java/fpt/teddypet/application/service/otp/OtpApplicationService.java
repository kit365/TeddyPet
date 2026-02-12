package fpt.teddypet.application.service.otp;

import fpt.teddypet.application.constants.auth.AuthLogMessages;
import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.input.auth.OtpService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.VerificationTokenPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpApplicationService implements OtpService {

    private final UserService userService;
    private final VerificationTokenPort verificationTokenPort;
    private final EmailServicePort emailServicePort;

    @Value("${app.name:TeddyPet}")
    private String appName;

    @Override
    public long sendGuestOtp(String email) {
        log.info(AuthLogMessages.LOG_OTP_SEND_GUEST_START, email);

        // 1. Check if email exists as member
        if (userService.existsByEmail(email)) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_GUEST_EMAIL_EXISTS);
        }

        // 2. Check Cooldown
        long remaining = verificationTokenPort.getResendCooldownSeconds(email);
        if (remaining > 0) {
            throw new IllegalArgumentException(String.format(AuthMessages.MESSAGE_WAIT_FOR_OTP, remaining));
        }

        // 3. Generate OTP
        String otp = generateOtp();

        // 4. Save to Redis
        verificationTokenPort.saveGuestOtp(email, otp);

        // 5. Save Cooldown
        verificationTokenPort.saveResendCooldown(email);

        // 6. Send Email
        emailServicePort.sendGuestOrderOtp(email, otp);

        log.info(AuthLogMessages.LOG_OTP_SEND_SUCCESS, email);

        return verificationTokenPort.getResendCooldownSeconds(email);
    }

    @Override
    public void verifyGuestOtp(String email, String otp) {
        validateGuestOtp(email, otp);
        // OTP Valid -> Delete to prevent reuse
        verificationTokenPort.deleteGuestOtp(email);
    }

    @Override
    public void validateGuestOtp(String email, String otp) {
        if (otp == null || otp.isBlank()) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OTP_REQUIRED);
        }

        Optional<String> storedOtp = verificationTokenPort.getGuestOtp(email);
        if (storedOtp.isEmpty() || !storedOtp.get().equals(otp)) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OTP_INVALID);
        }
    }

    @Override
    public long sendMemberOtp(String email) {
        log.info(AuthLogMessages.LOG_OTP_SEND_MEMBER_START, email);

        // 1. Check Cooldown
        long remaining = verificationTokenPort.getResendCooldownSeconds(email);
        if (remaining > 0) {
            throw new IllegalArgumentException(String.format(AuthMessages.MESSAGE_WAIT_FOR_OTP, remaining));
        }

        // 2. Generate OTP
        String otp = generateOtp();

        // 3. Save to Redis
        verificationTokenPort.saveGuestOtp(email, otp); // Re-use guest storage since it's email-based

        // 4. Save Cooldown
        verificationTokenPort.saveResendCooldown(email);

        // 5. Send Email
        emailServicePort.sendSecurityOtp(email, otp);

        log.info(AuthLogMessages.LOG_OTP_SEND_MEMBER_SUCCESS, email);

        return verificationTokenPort.getResendCooldownSeconds(email);
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}
