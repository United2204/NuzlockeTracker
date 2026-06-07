package com.nuzlocketracker.run.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "run_rule")
@Getter @Setter
public class RunRule {

    public enum RuleType {
        FIRST_ENCOUNTER_ONLY, PERMADEATH, NICKNAME_REQUIRED,
        SPECIES_CLAUSE, DUPLICATE_CLAUSE, ITEM_CLAUSE,
        REGIONAL_VARIANT_CLAUSE, LEVEL_CAP, MAX_CATCHES_PER_ROUTE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 30)
    private RuleType ruleType;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String value;
}
