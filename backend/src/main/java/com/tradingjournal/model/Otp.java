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
     * SHA-256 hash of the 6-digit code.
     * Raw code is never persisted — exists only in memory during generation
     * then sent to email and discarded.
     * Even if MongoDB is breached, hashes are useless without the raw code.
     */
    private String codeHash;

    private OtpType type;

    private OtpStatus status;

    private int attempts;

    private String requestIp;

    private String userAgent;

    @Indexed(expireAfterSeconds = 0)
    private LocalDateTime expiresAt;

    private LocalDateTime createdAt;

    private LocalDateTime verifiedAt;

    public enum OtpType {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }

    public enum OtpStatus {
        PENDING,    // issued, not yet used
        VERIFIED,   // used successfully
        EXPIRED,    // TTL passed or explicitly expired
        REVOKED,    // cancelled by new OTP issuance
        LOCKED      // too many failed attempts
    }
}