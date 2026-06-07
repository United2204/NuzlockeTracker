package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.RunReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RunReactionRepository extends JpaRepository<RunReaction, Long> {

    @Query("""
        SELECT r FROM RunReaction r
        JOIN FETCH r.reactionType
        WHERE r.run.id = :runId
    """)
    List<RunReaction> findByRunId(@Param("runId") UUID runId);

    Optional<RunReaction> findByRunIdAndUserIdAndReactionTypeId(UUID runId, UUID userId, Long reactionTypeId);

    void deleteByRunIdAndUserIdAndReactionTypeId(UUID runId, UUID userId, Long reactionTypeId);
}
