package fpt.teddypet.application.service;

import fpt.teddypet.application.dto.request.LoginRequest;
import fpt.teddypet.application.dto.request.RegisterRequest;
import fpt.teddypet.application.dto.response.AuthResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.RoleService;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.output.JwtTokenProviderPort;
import fpt.teddypet.domain.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthApplicationService implements AuthService {

    private final UserService userService;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProviderPort jwtTokenProviderPort;
    private final AuthenticationManager authenticationManager;

    private AuthResponse generateAuthResponse(User user) {
        String token = jwtTokenProviderPort.generateToken(user.getEmail());
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);
        
        return new AuthResponse(
                token,
                user.getEmail(),
                user.getFullName(),
                user.getRole().getName(),
                expiresAt
        );
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userService.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Get default role (USER)
        var defaultRole = roleService.getDefaultRole();

        // Create new user
        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(defaultRole)
                .isEnabled(true)
                .isAccountNonLocked(true)
                .build();

        user = userService.save(user);

        return generateAuthResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );

            // Get user from authentication
            User user = (User) authentication.getPrincipal();

            return generateAuthResponse(user);
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid email or password");
        }
    }
}

