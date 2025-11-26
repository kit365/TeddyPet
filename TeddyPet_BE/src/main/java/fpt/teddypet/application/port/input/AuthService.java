package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.auth.LoginRequest;
import fpt.teddypet.application.dto.request.auth.RegisterRequest;
import fpt.teddypet.application.dto.response.AuthResponse;
import fpt.teddypet.domain.entity.User;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    User getCurrentUser();
}

