package com.nuzlocketracker.social;

import com.nuzlocketracker.social.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;

    // ── Follow ────────────────────────────────────────────────────────────────

    @PostMapping("/api/users/{userId}/follow")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void follow(@PathVariable UUID userId, Authentication auth) {
        socialService.follow(me(auth), userId);
    }

    @DeleteMapping("/api/users/{userId}/follow")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(@PathVariable UUID userId, Authentication auth) {
        socialService.unfollow(me(auth), userId);
    }

    // ── Block ─────────────────────────────────────────────────────────────────

    @PostMapping("/api/users/{userId}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void block(@PathVariable UUID userId, Authentication auth) {
        socialService.block(me(auth), userId);
    }

    @DeleteMapping("/api/users/{userId}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblock(@PathVariable UUID userId, Authentication auth) {
        socialService.unblock(me(auth), userId);
    }

    // ── Public profile ────────────────────────────────────────────────────────

    @GetMapping("/api/users/{username}/profile")
    public PublicProfileResponse getPublicProfile(@PathVariable String username, Authentication auth) {
        UUID viewerId = auth != null ? me(auth) : null;
        return socialService.getPublicProfile(username, viewerId);
    }

    // ── Run subscription ──────────────────────────────────────────────────────

    @PostMapping("/api/runs/{runId}/subscription")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@PathVariable UUID runId, Authentication auth) {
        socialService.subscribe(me(auth), runId);
    }

    @DeleteMapping("/api/runs/{runId}/subscription")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@PathVariable UUID runId, Authentication auth) {
        socialService.unsubscribe(me(auth), runId);
    }

    // ── Favorite ──────────────────────────────────────────────────────────────

    @PostMapping("/api/runs/{runId}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void favorite(@PathVariable UUID runId, Authentication auth) {
        socialService.favorite(me(auth), runId);
    }

    @DeleteMapping("/api/runs/{runId}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfavorite(@PathVariable UUID runId, Authentication auth) {
        socialService.unfavorite(me(auth), runId);
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    @GetMapping("/api/runs/{runId}/comments")
    public List<CommentResponse> getComments(@PathVariable UUID runId, Authentication auth) {
        return socialService.getComments(runId, me(auth));
    }

    @PostMapping("/api/runs/{runId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse postComment(
            @PathVariable UUID runId,
            @Valid @RequestBody PostCommentRequest req,
            Authentication auth) {
        return socialService.postComment(runId, me(auth), req);
    }

    @DeleteMapping("/api/runs/{runId}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable UUID runId,
            @PathVariable Long commentId,
            Authentication auth) {
        socialService.deleteComment(commentId, me(auth));
    }

    // ── Reactions ─────────────────────────────────────────────────────────────

    @GetMapping("/api/runs/{runId}/reactions")
    public ReactionSummary getReactions(@PathVariable UUID runId, Authentication auth) {
        return socialService.getReactions(runId, me(auth));
    }

    @PostMapping("/api/runs/{runId}/reactions")
    public ReactionSummary toggleReaction(
            @PathVariable UUID runId,
            @Valid @RequestBody ToggleReactionRequest req,
            Authentication auth) {
        return socialService.toggleReaction(runId, me(auth), req);
    }

    // ── Feed ──────────────────────────────────────────────────────────────────

    @GetMapping("/api/feed")
    public List<FeedEventResponse> getPublicFeed(
            @RequestParam(defaultValue = "0") int page) {
        return socialService.getPublicFeed(page);
    }

    @GetMapping("/api/feed/following")
    public List<FeedEventResponse> getFollowingFeed(
            @RequestParam(defaultValue = "0") int page,
            Authentication auth) {
        return socialService.getFollowingFeed(me(auth), page);
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    @GetMapping("/api/me/notifications")
    public List<NotificationResponse> getNotifications(Authentication auth) {
        return socialService.getNotifications(me(auth));
    }

    @PostMapping("/api/me/notifications/seen")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markSeen(Authentication auth) {
        socialService.markSeen(me(auth));
    }

    @PatchMapping("/api/me/notifications/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable Long id, Authentication auth) {
        socialService.markRead(id, me(auth));
    }

    @GetMapping("/api/me/notifications/unread-count")
    public long unreadCount(Authentication auth) {
        return socialService.countUnread(me(auth));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private UUID me(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
