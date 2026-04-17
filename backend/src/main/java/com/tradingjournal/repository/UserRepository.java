package com.tradingjournal.repository;

import com.tradingjournal.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    // ── Existing methods ──────────────────────────────────────────────────────

    Optional<User> findByEmail(String email);

    @Query("{ 'email': { $regex: ?0, $options: 'i' } }")
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    @Query(value = "{ 'email': { $regex: ?0, $options: 'i' } }", exists = true)
    boolean existsByEmailIgnoreCase(String email);

    // ── NEW: Cleanup — find unverified users older than cutoff ────────────────
    // These are users who registered but never completed email verification
    @Query("{ 'emailVerified': false, 'createdAt': { $lt: ?0 } }")
    List<User> findUnverifiedOlderThan(LocalDateTime cutoff);
}