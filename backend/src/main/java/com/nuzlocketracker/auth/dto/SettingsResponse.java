package com.nuzlocketracker.auth.dto;

import com.nuzlocketracker.auth.entity.UserSettings;

public record SettingsResponse(
        boolean allowFollowers,
        String language
) {
    public static SettingsResponse from(UserSettings s) {
        return new SettingsResponse(s.isAllowFollowers(), s.getLanguage());
    }
}
