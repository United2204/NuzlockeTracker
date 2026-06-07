package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.RunEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RunEventRepository extends JpaRepository<RunEvent, Long> {
    List<RunEvent> findAllByRunIdOrderByOccurredAtDesc(UUID runId);
}
