package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {}
