package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReactionTypeRepository extends JpaRepository<ReactionType, Long> {

    List<ReactionType> findByOwnerIsNullAndActiveTrue();
}
