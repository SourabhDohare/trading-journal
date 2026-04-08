package com.tradingjournal.controller;

import com.tradingjournal.dto.UserProfileDTO;
import com.tradingjournal.security.UserPrincipal;
import com.tradingjournal.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "View and update user trading profile")
public class UserProfileController {

    private final UserProfileService service;

    @GetMapping
    @Operation(summary = "Get current user's full profile")
    public ResponseEntity<UserProfileDTO.Response> getProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(service.getProfile(principal.getId()));
    }

    @PutMapping
    @Operation(summary = "Update user profile (partial update — only send changed fields)")
    public ResponseEntity<UserProfileDTO.Response> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UserProfileDTO.UpdateRequest request) {
        return ResponseEntity.ok(service.updateProfile(principal.getId(), request));
    }
}
