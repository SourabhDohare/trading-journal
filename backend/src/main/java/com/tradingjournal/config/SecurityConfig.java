package com.tradingjournal.config;

import com.tradingjournal.security.JwtAuthFilter;
import com.tradingjournal.security.OAuth2SuccessHandler;
import com.tradingjournal.security.CustomOAuth2UserService;
import com.tradingjournal.security.UserPrincipal;
import com.tradingjournal.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity                      // ← kept from your original
public class SecurityConfig {

    private final UserRepository          userRepository;
    private final JwtAuthFilter           jwtAuthFilter;
    private final OAuth2SuccessHandler    oAuth2SuccessHandler;
    private final CustomOAuth2UserService customOAuth2UserService;

    @Value("${app.cors.allowed-origins}")  // ← kept — reads from Render env var
    private String allowedOrigins;

    // @Lazy on JwtAuthFilter keeps your existing circular-dependency fix intact
    public SecurityConfig(UserRepository userRepository,
                          @Lazy JwtAuthFilter jwtAuthFilter,
                          OAuth2SuccessHandler oAuth2SuccessHandler,
                          CustomOAuth2UserService customOAuth2UserService) {
        this.userRepository          = userRepository;
        this.jwtAuthFilter           = jwtAuthFilter;
        this.oAuth2SuccessHandler    = oAuth2SuccessHandler;
        this.customOAuth2UserService = customOAuth2UserService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // OAuth2 needs a session briefly to complete the handshake — we use IF_REQUIRED
            // then immediately exchange for JWT and go stateless
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/auth/**",
                    "/api/v1/auth/**",
                    "/oauth2/**",                // Spring's OAuth2 authorization redirect
                    "/login/oauth2/**",           // Spring's OAuth2 callback
                    "/contact",                  // Public contact form
                    "/feedback",                 // Public feedback form
                    "/swagger-ui/**",
                    "/api-docs/**",
                    "/actuator/health"
                ).permitAll()
                .anyRequest().authenticated()
            )
            // ── Exception handling — NEVER show Spring's default /login page ──────────
            // For unauthenticated API requests: return 401 JSON response
            // This prevents Spring from redirecting to its default white-label login page
            .exceptionHandling(e -> e
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write(
                        "{\"status\":401,\"error\":\"Unauthorized\"," +
                        "\"message\":\"Authentication required.\"}"
                    );
                })
            )
            // ── OAuth2 social login (Google + GitHub) ─────────────────────────────────
            // loginPage() — tells Spring to NEVER redirect to its own /login page.
            // If OAuth2 state is lost (cross-site session issue), Spring will redirect
            // to the Angular login page instead of the Spring white-label page.
            .oauth2Login(oauth -> oauth
                .loginPage("https://marketsaga.site/auth/login")
                .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .failureUrl("https://marketsaga.site/auth/login?error=oauth_failed")
            )
            // ── JWT filter for API requests ───────────────────────────────────────────
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findById(username)
                .map(UserPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Split by comma — reads from app.cors.allowed-origins (Render env var)
        String[] origins = allowedOrigins.split(",");
        List<String> originList = new ArrayList<>();
        for (String origin : origins) originList.add(origin.trim());
        config.setAllowedOrigins(originList);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}