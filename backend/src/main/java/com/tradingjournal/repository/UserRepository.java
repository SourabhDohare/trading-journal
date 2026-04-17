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

    // ── Standard exact match (use when email is already normalised lowercase) ─
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // ── Case-insensitive: returns ALL matches (handles legacy duplicate data) ──
    // Named "Internal" so it's not confused with the safe wrapper below
    @Query("{ 'email': { $regex: ?0, $options: 'i' } }")
    List<User> findAllByEmailIgnoreCaseInternal(String email);

    // ── Safe case-insensitive lookup — NEVER throws on duplicates ─────────────
    // If duplicates exist in DB, prefers the verified account.
    // This protects against IncorrectResultSizeDataAccessException.
    default Optional<User> findByEmailIgnoreCase(String email) {
        List<User> results = findAllByEmailIgnoreCaseInternal(email);
        if (results.isEmpty()) return Optional.empty();
        if (results.size() == 1) return Optional.of(results.get(0));
        // Duplicates exist — prefer the verified account, else the oldest one
        return results.stream()
                .filter(com.tradingjournal.model.User::isEmailVerified)
                .findFirst()
                .or(() -> results.stream()
                        .min(java.util.Comparator.comparing(
                                u -> u.getCreatedAt() != null
                                        ? u.getCreatedAt()
                                        : LocalDateTime.MAX)));
    }

    // ── Case-insensitive exists check ─────────────────────────────────────────
    default boolean existsByEmailIgnoreCase(String email) {
        return !findAllByEmailIgnoreCaseInternal(email).isEmpty();
    }

    // ── Cleanup: find unverified users older than cutoff ──────────────────────
    @Query("{ 'emailVerified': false, 'createdAt': { $lt: ?0 } }")
    List<User> findUnverifiedOlderThan(LocalDateTime cutoff);
}