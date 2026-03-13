package fpt.teddypet.presentation.security.oauth2;

import fpt.teddypet.application.dto.response.TokenResponse;
import fpt.teddypet.application.port.input.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor(onConstructor_ = {@Lazy})
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String picture = oAuth2User.getAttribute("picture");

        log.info("[OAuth2Success] Đăng nhập thành công với email: {}", email);

        try {

            TokenResponse tokenResponse = authService.processGoogleUser(email, firstName, lastName, picture);

            String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/callback")
                    .queryParam("token", tokenResponse.token())
                    .queryParam("refreshToken", tokenResponse.refreshToken())
                    .queryParam("mustChangePassword", tokenResponse.mustChangePassword())
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } catch (Exception e) {
            log.error("[OAuth2Success] Lỗi xử lý user: {}", e.getMessage());
            response.sendRedirect(frontendUrl + "/auth/login?error=" + e.getMessage());
        }
    }
}
