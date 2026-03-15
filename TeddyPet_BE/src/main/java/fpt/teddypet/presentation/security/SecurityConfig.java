package fpt.teddypet.presentation.security;

import fpt.teddypet.config.CorsConstants;
import fpt.teddypet.presentation.filter.JwtAuthenticationFilter;
import fpt.teddypet.presentation.security.oauth2.OAuth2AuthenticationSuccessHandler;
import fpt.teddypet.domain.enums.RoleEnum;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler;
    private final AuthenticationProvider authenticationProvider;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, 
                          OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler,
                          AuthenticationProvider authenticationProvider) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Booking: cho phép mọi user (kể cả khách) xem khung giờ theo dịch vụ — ưu tiên trước
                        .requestMatchers(HttpMethod.GET, "/api/time-slots/service/*", "/api/time-slots/service/**").permitAll()
                        .requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()
                        // Public Order APIs
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/*/received").permitAll()
                        .requestMatchers("/api/orders/track/**").permitAll()
                        .requestMatchers("/api/orders/guest/**").permitAll()
                        // Payment & Webhooks (PayOS & others) - Prioritize to avoid 403
                        .requestMatchers("/api/payments/**", "/api/payment/**", "/api/v1/payments/**",
                                "/api/v1/payment/**")
                        .permitAll()
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
                                "/dev/**",
                                "/ws/**",
                                "/error")
                        .permitAll()
                        // Booking: cho phép khách (chưa đăng nhập) xem danh mục & dịch vụ để đặt lịch
                        .requestMatchers(HttpMethod.GET, "/api/service-categories", "/api/service-categories/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services", "/api/services/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/service-pricings", "/api/service-pricings/**").permitAll()
                        // Booking: cho phép khách xem bố trí phòng & danh sách phòng để chọn phòng
                        .requestMatchers(HttpMethod.GET, "/api/room-layout-configs", "/api/room-layout-configs/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rooms", "/api/rooms/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/room-types", "/api/room-types/**").permitAll()
                        // Booking: cho phép khách đặt lịch và tra cứu booking
                        .requestMatchers(HttpMethod.POST, "/api/bookings").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/bookings/code/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/bookings/code/*/contact").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/bookings/code/*/cancel").permitAll()
                        // Booking: policy hoàn cọc public cho khách xem khi hủy đơn
                        .requestMatchers(HttpMethod.GET, "/api/booking-deposit-refund-policies", "/api/booking-deposit-refund-policies/**")
                        .permitAll()
                        // Booking deposits (giữ chỗ + xác nhận cọc): cho phép khách vãng lai
                        .requestMatchers(HttpMethod.POST, "/api/bookings/deposit-intent").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/bookings/deposit-intent/*/confirm").permitAll()
                        // Banks: cho phép khách xem danh sách ngân hàng để nhập thông tin hoàn cọc
                        .requestMatchers(HttpMethod.GET, "/api/banks", "/api/banks/**").permitAll()
                        // Bank information cho booking (guest có thể nhập thông tin nhận hoàn tiền theo bookingCode)
                        .requestMatchers(HttpMethod.GET, "/api/bank-information/booking/code/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/bank-information/booking/code/*").permitAll()
                        // Guest Cart Sync
                        .requestMatchers(HttpMethod.POST, "/api/carts/guest/**", "/api/cart/guest/**").permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )
                .authenticationProvider(authenticationProvider)
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization
                                .baseUri("/api/auth/oauth2/authorization"))
                        .redirectionEndpoint(redirection -> redirection
                                .baseUri("/login/oauth2/code/*"))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers
                        .crossOriginOpenerPolicy(coop -> coop.policy(org.springframework.security.web.header.writers.CrossOriginOpenerPolicyHeaderWriter.CrossOriginOpenerPolicy.SAME_ORIGIN_ALLOW_POPUPS))
                );

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
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        String hierarchyStr = String.format("ROLE_%s > ROLE_%s\nROLE_%s > ROLE_%s\nROLE_%s > ROLE_%s",
                RoleEnum.SUPER_ADMIN.name(), RoleEnum.ADMIN.name(),
                RoleEnum.ADMIN.name(), RoleEnum.STAFF.name(),
                RoleEnum.STAFF.name(), RoleEnum.USER.name());
        hierarchy.setHierarchy(hierarchyStr);
        return hierarchy;
    }

    @Bean
    static MethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        return handler;
    }
}
