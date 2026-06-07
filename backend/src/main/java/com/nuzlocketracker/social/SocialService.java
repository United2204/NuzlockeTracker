package com.nuzlocketracker.social;

import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.auth.repository.UserRepository;
import com.nuzlocketracker.auth.repository.UserSettingsRepository;
import com.nuzlocketracker.common.exception.ConflictException;
import com.nuzlocketracker.common.exception.ResourceNotFoundException;
import com.nuzlocketracker.run.entity.Run;
import com.nuzlocketracker.run.entity.RunEvent;
import com.nuzlocketracker.run.repository.RunEventRepository;
import com.nuzlocketracker.run.repository.RunRepository;
import com.nuzlocketracker.social.dto.*;
import com.nuzlocketracker.social.entity.*;
import com.nuzlocketracker.social.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SocialService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final RunRepository runRepository;
    private final UserFollowRepository userFollowRepository;
    private final RunSubscriptionRepository runSubscriptionRepository;
    private final RunFavoriteRepository runFavoriteRepository;
    private final RunCommentRepository runCommentRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final RunReactionRepository runReactionRepository;
    private final NotificationRepository notificationRepository;
    private final UserBlockRepository userBlockRepository;
    private final RunEventRepository runEventRepository;

    // ── Follow ──────────────────────────────────────────────────────────────

    @Transactional
    public void follow(UUID followerId, UUID followedId) {
        if (followerId.equals(followedId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés seguirte a vos mismo");
        if (userFollowRepository.existsByFollowerIdAndFollowedId(followerId, followedId))
            throw new ConflictException("Ya seguís a este usuario");

        User follower = requireUser(followerId);
        User followed = requireUser(followedId);

        var follow = new UserFollow();
        follow.setFollower(follower);
        follow.setFollowed(followed);
        userFollowRepository.save(follow);

        createNotification(followed, Notification.Type.NEW_FOLLOWER, followerId.getMostSignificantBits());
    }

    @Transactional
    public void unfollow(UUID followerId, UUID followedId) {
        if (!userFollowRepository.existsByFollowerIdAndFollowedId(followerId, followedId))
            throw new ResourceNotFoundException("No seguís a este usuario");
        userFollowRepository.deleteByFollowerIdAndFollowedId(followerId, followedId);
    }

    // ── Subscription ────────────────────────────────────────────────────────

    @Transactional
    public void subscribe(UUID userId, UUID runId) {
        if (runSubscriptionRepository.existsByUserIdAndRunId(userId, runId))
            throw new ConflictException("Ya estás suscripto a esta run");
        Run run = requireVisibleRun(runId, userId);
        var sub = new RunSubscription();
        sub.setUser(requireUser(userId));
        sub.setRun(run);
        runSubscriptionRepository.save(sub);
        run.setSubscriberCount(run.getSubscriberCount() + 1);
        runRepository.save(run);
    }

    @Transactional
    public void unsubscribe(UUID userId, UUID runId) {
        RunSubscription sub = runSubscriptionRepository.findByUserIdAndRunId(userId, runId)
                .orElseThrow(() -> new ResourceNotFoundException("No estás suscripto a esta run"));
        runSubscriptionRepository.delete(sub);
        Run run = runRepository.findById(runId).orElseThrow();
        run.setSubscriberCount(Math.max(0, run.getSubscriberCount() - 1));
        runRepository.save(run);
    }

    // ── Favorite ─────────────────────────────────────────────────────────────

    @Transactional
    public void favorite(UUID userId, UUID runId) {
        if (runFavoriteRepository.existsByUserIdAndRunId(userId, runId))
            throw new ConflictException("Ya tenés esta run en favoritos");
        Run run = requireVisibleRun(runId, userId);
        var fav = new RunFavorite();
        fav.setUser(requireUser(userId));
        fav.setRun(run);
        runFavoriteRepository.save(fav);
    }

    @Transactional
    public void unfavorite(UUID userId, UUID runId) {
        if (!runFavoriteRepository.existsByUserIdAndRunId(userId, runId))
            throw new ResourceNotFoundException("Esta run no está en tus favoritos");
        runFavoriteRepository.deleteByUserIdAndRunId(userId, runId);
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(UUID runId, UUID viewerId) {
        requireVisibleRun(runId, viewerId);
        List<RunComment> topLevel = runCommentRepository.findTopLevelByRunId(runId);
        if (topLevel.isEmpty()) return List.of();

        List<Long> parentIds = topLevel.stream().map(RunComment::getId).toList();
        List<RunComment> replies = runCommentRepository.findRepliesByParentIds(parentIds);

        Map<Long, List<CommentResponse>> repliesByParent = replies.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getParent().getId(),
                        Collectors.mapping(this::toCommentResponse, Collectors.toList())
                ));

        return topLevel.stream()
                .map(c -> toCommentResponseWithReplies(c, repliesByParent.getOrDefault(c.getId(), List.of())))
                .toList();
    }

    @Transactional
    public CommentResponse postComment(UUID runId, UUID authorId, PostCommentRequest req) {
        requireVisibleRun(runId, authorId);

        RunComment parent = null;
        if (req.parentCommentId() != null) {
            parent = runCommentRepository.findById(req.parentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Comentario padre no encontrado"));
            if (parent.getParent() != null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se permiten respuestas anidadas");
        }

        var comment = new RunComment();
        comment.setRun(runRepository.getReferenceById(runId));
        comment.setUser(requireUser(authorId));
        comment.setParent(parent);
        comment.setContent(req.content());
        runCommentRepository.save(comment);
        return toCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, UUID requesterId) {
        RunComment comment = runCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comentario no encontrado"));
        if (!comment.getUser().getId().equals(requesterId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No podés borrar este comentario");
        comment.setDeletedAt(OffsetDateTime.now());
        runCommentRepository.save(comment);
    }

    // ── Reactions ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReactionSummary getReactions(UUID runId, UUID viewerId) {
        requireVisibleRun(runId, viewerId);
        List<RunReaction> reactions = runReactionRepository.findByRunId(runId);
        List<ReactionType> available = reactionTypeRepository.findByOwnerIsNullAndActiveTrue();

        Map<Long, Long> counts = reactions.stream()
                .collect(Collectors.groupingBy(r -> r.getReactionType().getId(), Collectors.counting()));
        Set<Long> userReacted = reactions.stream()
                .filter(r -> r.getUser().getId().equals(viewerId))
                .map(r -> r.getReactionType().getId())
                .collect(Collectors.toSet());

        List<ReactionSummary.ReactionCount> countList = available.stream()
                .map(rt -> new ReactionSummary.ReactionCount(
                        rt.getId(), rt.getLabel(), rt.getEmoji(),
                        counts.getOrDefault(rt.getId(), 0L),
                        userReacted.contains(rt.getId())
                ))
                .toList();

        List<ReactionSummary.ReactionTypeInfo> availableList = available.stream()
                .map(rt -> new ReactionSummary.ReactionTypeInfo(rt.getId(), rt.getLabel(), rt.getEmoji()))
                .toList();

        return new ReactionSummary(countList, availableList);
    }

    @Transactional
    public ReactionSummary toggleReaction(UUID runId, UUID userId, ToggleReactionRequest req) {
        requireVisibleRun(runId, userId);
        Optional<RunReaction> existing = runReactionRepository
                .findByRunIdAndUserIdAndReactionTypeId(runId, userId, req.reactionTypeId());
        if (existing.isPresent()) {
            runReactionRepository.delete(existing.get());
        } else {
            ReactionType rt = reactionTypeRepository.findById(req.reactionTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tipo de reacción no encontrado"));
            var reaction = new RunReaction();
            reaction.setRun(runRepository.getReferenceById(runId));
            reaction.setUser(requireUser(userId));
            reaction.setReactionType(rt);
            runReactionRepository.save(reaction);
        }
        return getReactions(runId, userId);
    }

    // ── Feed ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FeedEventResponse> getPublicFeed(int page) {
        return runEventRepository.findPublicFeed(PageRequest.of(page, 20))
                .stream().map(this::toFeedEvent).toList();
    }

    @Transactional(readOnly = true)
    public List<FeedEventResponse> getFollowingFeed(UUID userId, int page) {
        return runEventRepository.findFollowingFeed(userId, PageRequest.of(page, 20))
                .stream().map(this::toFeedEvent).toList();
    }

    // ── Notifications ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toNotificationResponse).toList();
    }

    @Transactional
    public void markSeen(UUID userId) {
        userSettingsRepository.findById(userId).ifPresent(s -> {
            s.setLastSeenNotificationsAt(OffsetDateTime.now());
            userSettingsRepository.save(s);
        });
    }

    @Transactional
    public void markRead(Long notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada"));
        if (!n.getUser().getId().equals(userId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countUnread(userId);
    }

    // ── Block ─────────────────────────────────────────────────────────────────

    @Transactional
    public void block(UUID blockerId, UUID blockedId) {
        if (blockerId.equals(blockedId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés bloquearte a vos mismo");
        if (userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId))
            throw new ConflictException("Ya bloqueaste a este usuario");
        var block = new UserBlock();
        block.setBlocker(requireUser(blockerId));
        block.setBlocked(requireUser(blockedId));
        userBlockRepository.save(block);
        // Eliminar follow mutuo si existe
        if (userFollowRepository.existsByFollowerIdAndFollowedId(blockerId, blockedId))
            userFollowRepository.deleteByFollowerIdAndFollowedId(blockerId, blockedId);
        if (userFollowRepository.existsByFollowerIdAndFollowedId(blockedId, blockerId))
            userFollowRepository.deleteByFollowerIdAndFollowedId(blockedId, blockerId);
    }

    @Transactional
    public void unblock(UUID blockerId, UUID blockedId) {
        if (!userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId))
            throw new ResourceNotFoundException("No bloqueaste a este usuario");
        userBlockRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    // ── Public profile ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(String username, UUID viewerId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        long followers = userFollowRepository.countFollowers(user.getId());
        long following = userFollowRepository.countFollowing(user.getId());
        boolean isFollowing = viewerId != null &&
                userFollowRepository.existsByFollowerIdAndFollowedId(viewerId, user.getId());
        boolean isBlocked = viewerId != null &&
                userBlockRepository.existsByBlockerIdAndBlockedId(viewerId, user.getId());
        return new PublicProfileResponse(
                user.getId().toString(), user.getUsername(), user.isVerified(),
                followers, following, isFollowing, isBlocked
        );
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private Run requireVisibleRun(UUID runId, UUID viewerId) {
        Run run = runRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Run no encontrada"));
        if (run.getDeletedAt() != null)
            throw new ResourceNotFoundException("Run no encontrada");
        if (run.getVisibility() == Run.Visibility.PRIVATE) {
            if (viewerId == null || !run.getUser().getId().equals(viewerId))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta run es privada");
        } else if (run.getVisibility() == Run.Visibility.FOLLOWERS_ONLY) {
            if (viewerId == null || (
                    !run.getUser().getId().equals(viewerId) &&
                    !userFollowRepository.existsByFollowerIdAndFollowedId(viewerId, run.getUser().getId())
            )) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo seguidores pueden ver esta run");
            }
        }
        return run;
    }

    private void createNotification(User recipient, Notification.Type type, long referenceId) {
        var n = new Notification();
        n.setUser(recipient);
        n.setType(type);
        n.setReferenceId(referenceId);
        notificationRepository.save(n);
    }

    private CommentResponse toCommentResponse(RunComment c) {
        return toCommentResponseWithReplies(c, List.of());
    }

    private CommentResponse toCommentResponseWithReplies(RunComment c, List<CommentResponse> replies) {
        return new CommentResponse(
                c.getId(),
                c.getParent() != null ? c.getParent().getId() : null,
                c.getRunEvent() != null ? c.getRunEvent().getId() : null,
                c.getUser().getId().toString(),
                c.getUser().getUsername(),
                c.getDeletedAt() != null ? "[eliminado]" : c.getContent(),
                c.getCreatedAt(),
                replies
        );
    }

    private FeedEventResponse toFeedEvent(RunEvent e) {
        return new FeedEventResponse(
                e.getId(),
                e.getRun().getId(),
                e.getRun().getName(),
                e.getRun().getSlug(),
                e.getRun().getUser().getUsername(),
                e.getEventType().name(),
                e.getPayload(),
                e.getOccurredAt()
        );
    }

    private NotificationResponse toNotificationResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                n.getReferenceId(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
