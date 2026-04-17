package com.tradingjournal.repository;

import com.tradingjournal.model.Otp;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends MongoRepository<Otp, String> {

    // ── Core lookup — by status enum (replaces used=false) ───────────────────
    Optional<Otp> findTopByEmailAndTypeAndStatusOrderByCreatedAtDesc(
            String email, Otp.OtpType type, Otp.OtpStatus status);

    // ── Revoke all pending OTPs before issuing a new one ─────────────────────
    @Query("{ 'email': ?0, 'type': ?1, 'status': 'PENDING' }")
    @Update("{ '$set': { 'status': 'REVOKED' } }")
    void revokeAllPendingByEmailAndType(String email, Otp.OtpType type);

    // ── IP rate limiting ──────────────────────────────────────────────────────
    long countByRequestIpAndTypeAndStatus(
            String requestIp, Otp.OtpType type, Otp.OtpStatus status);

    // ── Cleanup queries ───────────────────────────────────────────────────────
    @Query(value = "{ 'expiresAt': { $lt: ?0 }, 'status': 'PENDING' }", delete = true)
    long deleteAllExpiredPending(LocalDateTime cutoff);

    @Query(value = "{ 'status': { $in: ['VERIFIED','REVOKED','LOCKED','EXPIRED'] }, " +
                   "'createdAt': { $lt: ?0 } }", delete = true)
    long deleteAllTerminalOlderThan(LocalDateTime cutoff);
}