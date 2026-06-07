package com.nuzlocketracker.social.repository;

import com.nuzlocketracker.social.entity.UserFollow;
import com.nuzlocketracker.social.entity.UserFollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollowId> {

    boolean existsByFollowerIdAndFollowedId(UUID followerId, UUID followedId);

    void deleteByFollowerIdAndFollowedId(UUID followerId, UUID followedId);

    @Query("SELECT COUNT(f) FROM UserFollow f WHERE f.followed.id = :userId")
    long countFollowers(@Param("userId") UUID userId);

    @Query("SELECT COUNT(f) FROM UserFollow f WHERE f.follower.id = :userId")
    long countFollowing(@Param("userId") UUID userId);
}
