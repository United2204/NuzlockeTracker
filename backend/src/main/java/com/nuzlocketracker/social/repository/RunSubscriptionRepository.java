package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.RunSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RunSubscriptionRepository extends JpaRepository<RunSubscription, Long> {

    boolean existsByUserIdAndRunId(UUID userId, UUID runId);

    Optional<RunSubscription> findByUserIdAndRunId(UUID userId, UUID runId);

    void deleteByUserIdAndRunId(UUID userId, UUID runId);

    long countByRunId(UUID runId);
}
