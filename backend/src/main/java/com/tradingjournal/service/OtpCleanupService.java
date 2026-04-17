package com.tradingjournal.service;

import com.tradingjournal.model.Otp;
import com.tradingjournal.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpCleanupService {

    private final OtpRepository otpRepository;

    /**
     * Runs every 30 minutes.
     *
     * Pass 1 — delete PENDING OTPs whose expiresAt has passed (TTL index backup).
     * Pass 2 — delete terminal OTPs (VERIFIED / REVOKED / LOCKED / EXPIRED)
     *           older than 24 hours (audit retention window).
     */
    @Scheduled(cron = "0 */30 * * * *")
    public void cleanupOtps() {
        LocalDateTime now      = LocalDateTime.now();
        LocalDateTime auditAge = now.minusHours(24);

        // Pass 1: expired PENDING OTPs — backup to MongoDB TTL index
        List<Otp> expiredPending = otpRepository.findExpiredPending(now);
        if (!expiredPending.isEmpty()) {
            otpRepository.deleteAll(expiredPending);
            log.info("[OTP_CLEANUP] expired_pending_deleted={}", expiredPending.size());
        }

        // Pass 2: terminal OTPs outside the 24h audit retention window
        List<Otp> terminal = otpRepository.findTerminalOlderThan(auditAge);
        if (!terminal.isEmpty()) {
            otpRepository.deleteAll(terminal);
            log.info("[OTP_CLEANUP] terminal_purged={}", terminal.size());
        }
    }
}