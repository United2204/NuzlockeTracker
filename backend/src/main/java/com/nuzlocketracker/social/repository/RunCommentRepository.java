package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.RunComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RunCommentRepository extends JpaRepository<RunComment, Long> {

    @Query("""
        SELECT c FROM RunComment c
        JOIN FETCH c.user
        LEFT JOIN FETCH c.runEvent
        WHERE c.run.id = :runId AND c.parent IS NULL
        AND (c.deletedAt IS NULL
             OR EXISTS (SELECT r FROM RunComment r WHERE r.parent = c AND r.deletedAt IS NULL))
        ORDER BY c.createdAt ASC
    """)
    List<RunComment> findTopLevelByRunId(@Param("runId") UUID runId);

    @Query("""
        SELECT c FROM RunComment c
        JOIN FETCH c.user
        WHERE c.parent.id IN :parentIds
        ORDER BY c.createdAt ASC
    """)
    List<RunComment> findRepliesByParentIds(@Param("parentIds") List<Long> parentIds);
}
