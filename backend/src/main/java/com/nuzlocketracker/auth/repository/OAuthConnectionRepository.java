package com.nuzlocketracker.auth.repository;

import com.nuzlocketracker.auth.entity.OAuthConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OAuthConnectionRepository extends JpaRepository<OAuthConnection, Long> {
    Optional<OAuthConnection> findByProviderAndProviderUserId(String provider, String providerUserId);
}
