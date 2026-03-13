package fpt.teddypet.presentation.filter;

import fpt.teddypet.infrastructure.adapter.JwtTokenProviderAdapter;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProviderAdapter jwtTokenProviderAdapter;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProviderAdapter jwtTokenProviderAdapter,
            UserDetailsService userDetailsService) {
        this.jwtTokenProviderAdapter = jwtTokenProviderAdapter;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String email;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (authHeader == null) {
                logger.debug("Authorization header is missing for request: " + request.getRequestURI());
            } else {
                logger.debug("Authorization header does not start with Bearer: " + request.getRequestURI());
            }
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        logger.debug("JWT detected in request: " + request.getRequestURI());
        try {
            email = jwtTokenProviderAdapter.extractEmail(jwt);
            logger.debug("Extracted email from JWT: " + email);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(email);
                logger.debug("Loaded UserDetails for: " + email);

                if (jwtTokenProviderAdapter.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("User authenticated: " + email);
                } else {
                    logger.warn("Token validation failed for email: " + email);
                }
            }
        } catch (ExpiredJwtException e) {
            logger.warn("JWT expired: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Cannot set user authentication: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
