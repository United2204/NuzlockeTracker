package com.nuzlocketracker.social.dto;

import java.util.List;

public record ReactionSummary(List<ReactionCount> counts, List<ReactionTypeInfo> available) {

    public record ReactionCount(Long reactionTypeId, String label, String emoji, long count, boolean userReacted) {}

    public record ReactionTypeInfo(Long id, String label, String emoji) {}
}
