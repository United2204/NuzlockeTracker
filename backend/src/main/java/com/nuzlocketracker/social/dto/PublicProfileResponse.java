package com.nuzlocketracker.social.dto;

public record PublicProfileResponse(
        String userId,
        String username,
        boolean isVerified,
        long followerCount,
        long followingCount,
        boolean isFollowing,
        boolean isBlocked
) {}
