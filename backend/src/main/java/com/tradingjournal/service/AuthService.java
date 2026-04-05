package com.tradingjournal.service;

import com.tradingjournal.dto.AuthDTO;
import com.tradingjournal.dto.UserDTO;
import com.tradingjournal.exception.BadRequestException;
import com.tradingjournal.model.User;
import com.tradingjournal.repository.UserRepository;
import com.tradingjournal.security.JwtTokenProvider;
import com.tradingjournal.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(User.Role.TRADER)
                .active(true)
                .strictMode(false)
                .timezone("Asia/Kolkata")
                .build();

        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        // Authenticate via email — we load user first to get the ID for JWT
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getId(), request.getPassword())
        );

        return buildAuthResponse(user);
    }

    public AuthDTO.AuthResponse refresh(AuthDTO.RefreshRequest request) {
        if (!tokenProvider.validateToken(request.getRefreshToken())) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        String userId = tokenProvider.getUserIdFromToken(request.getRefreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return buildAuthResponse(user);
    }

    private AuthDTO.AuthResponse buildAuthResponse(User user) {
        String accessToken = tokenProvider.generateToken(user.getId());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        UserDTO.Response userResp = new UserDTO.Response();
        userResp.setId(user.getId());
        userResp.setEmail(user.getEmail());
        userResp.setFirstName(user.getFirstName());
        userResp.setLastName(user.getLastName());
        userResp.setRole(user.getRole());
        userResp.setStrictMode(user.isStrictMode());
        userResp.setTimezone(user.getTimezone());
        userResp.setTradingConfig(user.getTradingConfig());
        userResp.setCreatedAt(user.getCreatedAt());

        AuthDTO.AuthResponse resp = new AuthDTO.AuthResponse();
        resp.setAccessToken(accessToken);
        resp.setRefreshToken(refreshToken);
        resp.setExpiresIn(tokenProvider.getExpirationMs());
        resp.setUser(userResp);
        return resp;
    }
}
