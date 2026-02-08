package fpt.teddypet.presentation.security;

import fpt.teddypet.config.CorsConstants;
import fpt.teddypet.presentation.filter.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, UserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()
                        // Public Order APIs
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/*/received").permitAll()
                        .requestMatchers("/api/orders/track/**").permitAll()
                        .requestMatchers("/api/orders/guest/**").permitAll()
                        // Public Product & Content APIs
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-brands/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-tags/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-variants/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/feedbacks/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/feedbacks").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/home/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/blog-posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/blog-categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ratings/**").permitAll()
                        // Guest OTP
                        .requestMatchers("/api/otp/**").permitAll()
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/settings/**",
                                "/api/shipping/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/api-docs/**",
                                "/swagger-ui.html",
                                "/error")
                        .permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider(passwordEncoder()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(CorsConstants.ALLOWED_ORIGINS);
        configuration.setAllowedMethods(CorsConstants.ALLOWED_METHODS);
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
