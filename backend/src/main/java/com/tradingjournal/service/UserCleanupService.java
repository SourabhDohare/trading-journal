package com.tradingjournal.service;

import com.tradingjournal.model.User;
import com.tradingjournal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cleans up incomplete registrations.
 *
 * Flow:
 *   1. User registers → saved with emailVerified=false
 *   2. OTP sent to email
 *   3a. User verifies → emailVerified=true → stays in DB ✓
 *   3b. User never verifies → stays unverified → this job deletes after 24h
 *
 * Why 24 hours?
 *   - OTP expires in 10 minutes, but we give users a generous window
 *     to come back and re-request OTP and complete verification.
 *   - After 24h of inactivity on an unverified account, it is safe to purge.
 *   - User can always re-register with the same email after purge.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserCleanupService {

    private final UserRepository userRepository;

    private static final int UNVERIFIED_RETENTION_HOURS = 24;

    /**
     * Runs every hour.
     * Deletes unverified user accounts older than 24 hours.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupUnverifiedUsers() {
        LocalDateTime cutoff = LocalDateTime.now()
                .minusHours(UNVERIFIED_RETENTION_HOURS);

        List<User> staleUnverified = userRepository.findUnverifiedOlderThan(cutoff);

        if (staleUnverified.isEmpty()) return;

        userRepository.deleteAll(staleUnverified);

        log.info("[USER_CLEANUP] Deleted {} unverified account(s) older than {}h",
                staleUnverified.size(), UNVERIFIED_RETENTION_HOURS);

        // Structured audit log — one line per deleted account for traceability
        staleUnverified.forEach(u ->
            log.info("[USER_CLEANUP] purged email={} createdAt={}",
                    u.getEmail(), u.getCreatedAt())
        );
    }
}