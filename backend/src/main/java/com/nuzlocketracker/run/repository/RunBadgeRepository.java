package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.RunBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RunBadgeRepository extends JpaRepository<RunBadge, Long> {
    List<RunBadge> findAllByRunIdOrderByObtainedAtAsc(UUID runId);
    Optional<RunBadge> findByRunIdAndBadgeId(UUID runId, Long badgeId);
    boolean existsByRunIdAndBadgeId(UUID runId, Long badgeId);
    void deleteByRunIdAndBadgeId(UUID runId, Long badgeId);
}
