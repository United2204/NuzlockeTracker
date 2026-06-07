package com.nuzlocketracker.social.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record CommentResponse(
        Long id,
        Long parentId,
        Long runEventId,
        String authorId,
        String authorUsername,
        String content,
        OffsetDateTime createdAt,
        List<CommentResponse> replies
) {}
