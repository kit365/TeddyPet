package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.auth.ForgotPasswordRequest;
import fpt.teddypet.application.dto.request.auth.ResetPasswordRequest;

public interface PasswordResetService {

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    boolean validateToken(String token);
}
