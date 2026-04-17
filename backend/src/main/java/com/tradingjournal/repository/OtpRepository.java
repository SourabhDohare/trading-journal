package com.tradingjournal.repository;

import com.tradingjournal.model.Otp;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpRepository extends MongoRepository<Otp, String> {

    // ── Core lookup ───────────────────────────────────────────────────────────
    Optional<Otp> findTopByEmailAndTypeAndStatusOrderByCreatedAtDesc(
            String email, Otp.OtpType type, Otp.OtpStatus status);

    // ── Fetch all PENDING OTPs for a given email+type (used by revoke logic) ──
    List<Otp> findByEmailAndTypeAndStatus(
            String email, Otp.OtpType type, Otp.OtpStatus status);

    // ── IP rate limiting ──────────────────────────────────────────────────────
    long countByRequestIpAndTypeAndStatus(
            String requestIp, Otp.OtpType type, Otp.OtpStatus status);

    // ── Cleanup: fetch expired PENDING OTPs for batch deletion ───────────────
    @Query("{ 'expiresAt': { $lt: ?0 }, 'status': 'PENDING' }")
    List<Otp> findExpiredPending(LocalDateTime cutoff);

    // ── Cleanup: fetch terminal OTPs outside audit retention window ───────────
    @Query("{ 'status': { $in: ['VERIFIED', 'REVOKED', 'LOCKED', 'EXPIRED'] }, 'createdAt': { $lt: ?0 } }")
    List<Otp> findTerminalOlderThan(LocalDateTime cutoff);
}