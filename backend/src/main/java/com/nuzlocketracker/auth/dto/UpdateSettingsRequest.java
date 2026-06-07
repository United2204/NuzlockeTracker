package com.nuzlocketracker.auth.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateSettingsRequest(
        Boolean allowFollowers,
        @Size(max = 2)
        @Pattern(regexp = "^(en|es)?$", message = "Language must be 'en', 'es', or empty")
        String language
) {}
