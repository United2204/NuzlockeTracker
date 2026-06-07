package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.createdAt > :since")
    long countUnreadSince(@Param("userId") UUID userId, @Param("since") OffsetDateTime since);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.read = false")
    long countUnread(@Param("userId") UUID userId);
}
