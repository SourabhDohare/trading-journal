package com.tradingjournal.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "otps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Otp {

    @Id
    private String id;

    @Indexed
    private String email;

    /**
     * NEVER store raw OTP — store SHA-256 hash.
     * Raw code exists only in memory during generation, then discarded.
     * Even if DB is breached, hashes are useless without the raw code.
     */
    private String codeHash;

    private OtpType type;

    private OtpStatus status;   // replaces boolean used

    private int attempts;

    private String requestIp;   // for audit + IP rate limiting

    private String userAgent;   // for audit trail

    @Indexed(expireAfterSeconds = 0)
    private LocalDateTime expiresAt;

    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt;   // when it was actually used

    public enum OtpType {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }

    public enum OtpStatus {
        PENDING,    // issued, not yet used
        VERIFIED,   // used successfully
        EXPIRED,    // TTL passed or explicitly invalidated
        REVOKED,    // cancelled by new OTP issuance
        LOCKED      // too many failed attempts
    }
}