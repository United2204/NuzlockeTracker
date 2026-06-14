package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.RunRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RunRuleRepository extends JpaRepository<RunRule, Long> {
    List<RunRule> findAllByRunId(UUID runId);
    Optional<RunRule> findByRunIdAndRuleType(UUID runId, RunRule.RuleType ruleType);
}
