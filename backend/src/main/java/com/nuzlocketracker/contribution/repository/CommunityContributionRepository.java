package com.nuzlocketracker.contribution.repository;

import com.nuzlocketracker.contribution.entity.CommunityContribution;
import com.nuzlocketracker.contribution.entity.ContributionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CommunityContributionRepository extends JpaRepository<CommunityContribution, Long> {

    @Query("""
        SELECT c FROM CommunityContribution c
        JOIN FETCH c.contributor
        JOIN FETCH c.game
        WHERE c.status = :status
        ORDER BY c.createdAt ASC
    """)
    List<CommunityContribution> findByStatusOrderByCreatedAt(@Param("status") ContributionStatus status);

    @Query("""
        SELECT c FROM CommunityContribution c
        JOIN FETCH c.game
        WHERE c.contributor.id = :contributorId
        ORDER BY c.createdAt DESC
    """)
    List<CommunityContribution> findByContributorIdOrderByCreatedAt(@Param("contributorId") UUID contributorId);
}
