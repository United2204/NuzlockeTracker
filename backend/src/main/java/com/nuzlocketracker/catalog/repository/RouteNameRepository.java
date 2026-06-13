package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.RouteName;
import com.nuzlocketracker.catalog.entity.RouteNameId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RouteNameRepository extends JpaRepository<RouteName, RouteNameId> {

    @Query("""
        SELECT n.route.id AS routeId, n.name AS name
        FROM RouteName n
        WHERE n.route.id IN :routeIds AND n.lang = :lang
    """)
    List<NameProjection> findNamesByRouteIdsAndLang(@Param("routeIds") Collection<Long> routeIds,
                                                    @Param("lang") String lang);

    interface NameProjection {
        Long getRouteId();
        String getName();
    }
}
