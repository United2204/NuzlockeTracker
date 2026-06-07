package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByGameIdOrderByDisplayOrderAsc(Long gameId);
}
