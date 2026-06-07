package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.RunFavorite;
import com.nuzlocketracker.social.entity.RunFavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RunFavoriteRepository extends JpaRepository<RunFavorite, RunFavoriteId> {

    boolean existsByUserIdAndRunId(UUID userId, UUID runId);

    void deleteByUserIdAndRunId(UUID userId, UUID runId);
}
