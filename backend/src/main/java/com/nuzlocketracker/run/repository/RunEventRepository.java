package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.RunEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RunEventRepository extends JpaRepository<RunEvent, Long> {

    List<RunEvent> findAllByRunIdOrderByOccurredAtDesc(UUID runId);

    @Query("""
        SELECT e FROM RunEvent e
        JOIN FETCH e.run r
        JOIN FETCH r.user u
        WHERE r.visibility = 'PUBLIC'
          AND r.deletedAt IS NULL
          AND u.deletedAt IS NULL
        ORDER BY e.occurredAt DESC
    """)
    List<RunEvent> findPublicFeed(Pageable pageable);

    @Query("""
        SELECT e FROM RunEvent e
        JOIN FETCH e.run r
        JOIN FETCH r.user u
        WHERE r.deletedAt IS NULL
          AND u.deletedAt IS NULL
          AND (
            (r.visibility = 'PUBLIC')
            OR (r.visibility = 'FOLLOWERS_ONLY'
                AND EXISTS (
                  SELECT 1 FROM UserFollow f
                  WHERE f.follower.id = :viewerId AND f.followed.id = u.id
                ))
          )
          AND u.id IN (
            SELECT f.followed.id FROM UserFollow f WHERE f.follower.id = :viewerId
          )
        ORDER BY e.occurredAt DESC
    """)
    List<RunEvent> findFollowingFeed(@Param("viewerId") UUID viewerId, Pageable pageable);
}
