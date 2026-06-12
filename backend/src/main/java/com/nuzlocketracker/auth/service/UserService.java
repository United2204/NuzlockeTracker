package com.nuzlocketracker.auth.service;

import com.nuzlocketracker.auth.dto.*;
import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.auth.entity.UsernameHistory;
import com.nuzlocketracker.auth.repository.UsernameHistoryRepository;
import com.nuzlocketracker.auth.repository.UserRepository;
import com.nuzlocketracker.auth.repository.UserSettingsRepository;
import com.nuzlocketracker.common.exception.ConflictException;
import com.nuzlocketracker.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final UsernameHistoryRepository usernameHistoryRepository;

    public MeResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (req.username() != null && !req.username().equals(user.getUsername())) {
            if (user.getLastUsernameChangedAt() != null &&
                    user.getLastUsernameChangedAt().isAfter(OffsetDateTime.now().minusDays(30))) {
                throw new ConflictException("Username can only be changed every 30 days");
            }
            if (userRepository.existsByUsername(req.username())) {
                throw new ConflictException("Username already taken");
            }

            UsernameHistory history = new UsernameHistory();
            history.setUser(user);
            history.setOldUsername(user.getUsername());
            usernameHistoryRepository.save(history);

            user.setUsername(req.username());
            user.setLastUsernameChangedAt(OffsetDateTime.now());
        }

        if (req.avatarUrl() != null) {
            user.setAvatarUrl(req.avatarUrl().isBlank() ? null : req.avatarUrl().trim());
        }

        return MeResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public SettingsResponse getSettings(UUID userId) {
        return SettingsResponse.from(
                userSettingsRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Settings", userId))
        );
    }

    public SettingsResponse updateSettings(UUID userId, UpdateSettingsRequest req) {
        var settings = userSettingsRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Settings", userId));

        if (req.allowFollowers() != null) settings.setAllowFollowers(req.allowFollowers());
        if (req.language() != null) {
            settings.setLanguage(req.language().isBlank() ? null : req.language());
        }

        return SettingsResponse.from(userSettingsRepository.save(settings));
    }
}
