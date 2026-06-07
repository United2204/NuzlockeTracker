package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.ItemCalcEffect;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemCalcEffectRepository extends JpaRepository<ItemCalcEffect, Long> {

    @Query(value = """
            SELECT ice.item_id    AS "itemId",
                   iname.name,
                   ice.effect_json::text AS "effectJson"
            FROM item_calc_effect ice
            JOIN item_name iname ON iname.item_id = ice.item_id AND iname.lang = :lang
            ORDER BY iname.name
            """, nativeQuery = true)
    List<ItemCalcProjection> findAllWithNames(@Param("lang") String lang);

    interface ItemCalcProjection {
        Long getItemId();
        String getName();
        String getEffectJson();
    }
}
