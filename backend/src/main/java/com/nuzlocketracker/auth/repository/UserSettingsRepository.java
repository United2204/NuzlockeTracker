package com.nuzlocketracker.auth.repository;

import com.nuzlocketracker.auth.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {}
