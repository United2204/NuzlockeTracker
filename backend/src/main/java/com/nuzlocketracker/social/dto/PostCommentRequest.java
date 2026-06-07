package com.nuzlocketracker.social.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostCommentRequest(
        @NotBlank @Size(max = 2000) String content,
        Long parentCommentId,
        Long runEventId
) {}
