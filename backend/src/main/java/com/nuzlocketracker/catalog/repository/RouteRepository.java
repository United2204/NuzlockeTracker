package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {

    @Query("""
            SELECT r FROM Route r
            LEFT JOIN FETCH r.requiredBadge
            WHERE r.game.id = :gameId
            ORDER BY r.displayOrder ASC
            """)
    List<Route> findByGameIdOrderByDisplayOrder(@Param("gameId") Long gameId);
}
