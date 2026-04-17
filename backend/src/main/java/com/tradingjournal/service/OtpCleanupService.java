package com.tradingjournal.service;

import com.tradingjournal.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpCleanupService {

    private final OtpRepository otpRepository;

    /**
     * Every 30 minutes:
     *  1. Expire any PENDING OTPs whose expiresAt passed (TTL backup)
     *  2. Delete terminal OTPs (VERIFIED/REVOKED/LOCKED/EXPIRED) older than 24h
     *     — 24h gives audit trail for security investigations
     */
    @Scheduled(cron = "0 */30 * * * *")
    public void cleanupOtps() {
        LocalDateTime now      = LocalDateTime.now();
        LocalDateTime auditAge = now.minusHours(24);

        long expiredDeleted  = otpRepository.deleteAllExpiredPending(now);
        long terminalDeleted = otpRepository.deleteAllTerminalOlderThan(auditAge);

        if (expiredDeleted > 0 || terminalDeleted > 0) {
            log.info("[OTP_CLEANUP] expired_pending={} terminal_purged={}",
                    expiredDeleted, terminalDeleted);
        }
    }
}