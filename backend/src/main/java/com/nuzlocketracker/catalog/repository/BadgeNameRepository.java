package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.BadgeName;
import com.nuzlocketracker.catalog.entity.BadgeNameId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface BadgeNameRepository extends JpaRepository<BadgeName, BadgeNameId> {

    @Query("""
        SELECT n.badge.id AS badgeId, n.name AS name
        FROM BadgeName n
        WHERE n.badge.id IN :badgeIds AND n.lang = :lang
    """)
    List<NameProjection> findNamesByBadgeIdsAndLang(@Param("badgeIds") Collection<Long> badgeIds,
                                                     @Param("lang") String lang);

    interface NameProjection {
        Long getBadgeId();
        String getName();
    }
}
