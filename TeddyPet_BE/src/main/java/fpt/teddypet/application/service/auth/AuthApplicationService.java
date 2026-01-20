package fpt.teddypet.application.service.auth;

import fpt.teddypet.application.constants.auth.AuthLogMessages;
import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.dto.request.auth.LoginRequest;
import fpt.teddypet.application.dto.request.auth.RegisterRequest;
import fpt.teddypet.application.dto.response.AuthResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.RoleService;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.output.JwtTokenProviderPort;
import fpt.teddypet.domain.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
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
        
        // Get primary role name
        String roleName = user.getRole().getName();

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roleName,
                expiresAt
        );
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        log.info(AuthLogMessages.LOG_AUTH_REGISTER_START, request.email());

        // Check if user already exists
        if (userService.existsByEmail(request.email())) {
            log.warn(AuthLogMessages.LOG_AUTH_REGISTER_WARN_EMAIL_EXISTS, request.email());
            throw new IllegalArgumentException(AuthMessages.MESSAGE_EMAIL_DUPLICATE);
        }
        if (userService.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }

        try {
            // Get default role (USER)
            var defaultRole = roleService.getDefaultRole();

            // Create new user
            User user = User.builder()
                    .username(request.username())
                    .email(request.email())
                    .password(passwordEncoder.encode(request.password()))
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .phoneNumber(request.phoneNumber())
                    .status(fpt.teddypet.domain.enums.UserStatusEnum.ACTIVE)
                    .role(defaultRole)
                    .build();

            userService.save(user);
            log.info(AuthLogMessages.LOG_AUTH_REGISTER_SUCCESS, user.getId());

        } catch (Exception e) {
            log.error(AuthLogMessages.LOG_AUTH_REGISTER_ERROR_DB, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info(AuthLogMessages.LOG_AUTH_LOGIN_START, request.usernameOrEmail());

        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.usernameOrEmail(),
                            request.password()
                    )
            );

            // Get user from authentication
            User user = (User) authentication.getPrincipal();
            
            // Reset failed attempts on success
            userService.resetFailedLoginAttempts(user);
            
            log.info(AuthLogMessages.LOG_AUTH_LOGIN_SUCCESS, request.usernameOrEmail());

            return generateAuthResponse(user);
        } catch (BadCredentialsException e) {
            log.warn(AuthLogMessages.LOG_AUTH_LOGIN_ERROR_INVALID_CREDENTIALS, request.usernameOrEmail());
            
            // Track failed attempt
            try {
                User user = userService.getByUsernameOrEmail(request.usernameOrEmail());
                userService.trackFailedLogin(user);
            } catch (Exception ex) {
                // User not found, ignore
            }
            
            throw new BadCredentialsException(AuthMessages.MESSAGE_INVALID_CREDENTIALS);
        }
    }

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException(AuthMessages.MESSAGE_USER_NOT_AUTHENTICATED);
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            String email = userDetails.getUsername();
            return userService.getByEmail(email);
        }

        throw new IllegalStateException(AuthMessages.MESSAGE_CANNOT_DETERMINE_USER);
    }
}

