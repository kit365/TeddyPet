package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.LoginRequest;
import fpt.teddypet.application.dto.request.RegisterRequest;
import fpt.teddypet.application.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}

