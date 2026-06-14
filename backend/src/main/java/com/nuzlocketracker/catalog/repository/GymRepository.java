package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.Gym;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GymRepository extends JpaRepository<Gym, Long> {
    List<Gym> findByGameIdOrderByDisplayOrderAsc(Long gameId);
}
