package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.Run;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RunRepository extends JpaRepository<Run, UUID> {

    @Query("SELECT r FROM Run r WHERE r.user.id = :userId AND r.deletedAt IS NULL ORDER BY r.displayOrder ASC, r.startedAt DESC")
    List<Run> findAllByUserId(@Param("userId") UUID userId);

    Optional<Run> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByUserIdAndSlug(UUID userId, String slug);

    @Query("SELECT COUNT(r) FROM Run r WHERE r.user.id = :userId AND r.deletedAt IS NULL")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(r) FROM Run r WHERE r.user.id = :userId AND r.deletedAt IS NULL AND r.status = :status")
    long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") Run.Status status);
}
