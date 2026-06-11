package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;
import java.util.UUID;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    void deleteByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    /** Returns IDs of all users blocked by the given user (for feed/comment filtering). */
    @Query("SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :blockerId")
    Set<UUID> findBlockedIdsByBlocker(@Param("blockerId") UUID blockerId);
}
