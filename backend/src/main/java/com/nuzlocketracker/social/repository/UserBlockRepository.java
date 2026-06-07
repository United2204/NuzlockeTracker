package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    void deleteByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);
}
