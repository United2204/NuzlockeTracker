package com.nuzlocketracker.auth.controller;

import com.nuzlocketracker.auth.dto.*;
import com.nuzlocketracker.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping
    public MeResponse updateProfile(@Valid @RequestBody UpdateProfileRequest req, Authentication auth) {
        return userService.updateProfile(userId(auth), req);
    }

    @GetMapping("/settings")
    public SettingsResponse getSettings(Authentication auth) {
        return userService.getSettings(userId(auth));
    }

    @PatchMapping("/settings")
    public SettingsResponse updateSettings(@Valid @RequestBody UpdateSettingsRequest req, Authentication auth) {
        return userService.updateSettings(userId(auth), req);
    }

    private UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
