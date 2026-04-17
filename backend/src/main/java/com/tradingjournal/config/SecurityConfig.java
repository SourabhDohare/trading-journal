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
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
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

    private static final String OAUTH2_FAILURE_URL =
            "https://marketsaga.site/auth/login?error=oauth_failed";

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
            // ── Exception handling ────────────────────────────────────────────────
            // Only apply JSON 401 to actual API requests.
            // OAuth2 browser flows (/login/oauth2/**, /oauth2/**) must NEVER get
            // JSON 401 — they need a redirect to Angular's login page instead.
            .exceptionHandling(e -> e
                .defaultAuthenticationEntryPointFor(
                    // For OAuth2 browser flows: redirect to Angular login page
                    (request, response, ex) ->
                        response.sendRedirect(OAUTH2_FAILURE_URL),
                    // Matches OAuth2 paths — browser-based, not API
                    new OrRequestMatcher(
                        new AntPathRequestMatcher("/login/oauth2/**"),
                        new AntPathRequestMatcher("/oauth2/**")
                    )
                )
                .defaultAuthenticationEntryPointFor(
                    // For all other paths (JWT API calls): return JSON 401
                    (request, response, ex) -> {
                        response.setContentType("application/json");
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.getWriter().write(
                            "{\"status\":401,\"error\":\"Unauthorized\"," +
                            "\"message\":\"Authentication required.\"}"
                        );
                    },
                    // Matches everything else (API endpoints)
                    request -> true
                )
            )
            // ── OAuth2 social login (Google + GitHub) ─────────────────────────────
            // loginPage() — tells Spring NEVER to show its white-label /login page
            .oauth2Login(oauth -> oauth
                .loginPage("https://marketsaga.site/auth/login")
                .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .failureUrl(OAUTH2_FAILURE_URL)
            )
            // ── JWT filter for API requests ───────────────────────────────────────
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