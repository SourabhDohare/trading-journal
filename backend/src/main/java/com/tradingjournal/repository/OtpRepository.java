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

    // ── Fetch all PENDING OTPs for a given email+type ─────────────────────────
    List<Otp> findByEmailAndTypeAndStatus(
            String email, Otp.OtpType type, Otp.OtpStatus status);

    // ── IP rate limiting ──────────────────────────────────────────────────────
    long countByRequestIpAndTypeAndStatus(
            String requestIp, Otp.OtpType type, Otp.OtpStatus status);

    // ── Cleanup: expired PENDING OTPs ─────────────────────────────────────────
    @Query("{ 'expiresAt': { $lt: ?0 }, 'status': 'PENDING' }")
    List<Otp> findExpiredPending(LocalDateTime cutoff);

    // ── Cleanup: terminal OTPs outside 24h audit window ───────────────────────
    @Query("{ 'status': { $in: ['VERIFIED', 'REVOKED', 'LOCKED', 'EXPIRED'] }, 'createdAt': { $lt: ?0 } }")
    List<Otp> findTerminalOlderThan(LocalDateTime cutoff);
}