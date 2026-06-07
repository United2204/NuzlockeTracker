package com.nuzlocketracker.auth.repository;

import com.nuzlocketracker.auth.entity.UsernameHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsernameHistoryRepository extends JpaRepository<UsernameHistory, Long> {}
