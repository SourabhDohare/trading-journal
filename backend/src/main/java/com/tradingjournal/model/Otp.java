package com.tradingjournal.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * OTP document — stored in MongoDB with automatic TTL expiry.
 *
 * MongoDB TTL index on `expiresAt` deletes documents automatically.
 * Add this index in Atlas or via @CompoundIndex — see OtpRepository.
 *
 * OTP types:
 *  EMAIL_VERIFICATION — sent after registration, must verify before login
 *  PASSWORD_RESET     — sent on forgot-password request
 */
@Document(collection = "otps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Otp {

    @Id
    private String id;

    @Indexed
    private String email;       // normalised lowercase

    private String code;        // 6-digit numeric

    private OtpType type;

    private boolean used;       // consumed once verified

    private int attempts;       // track brute-force

    @Indexed(expireAfterSeconds = 0)  // TTL — MongoDB deletes when expiresAt passes
    private LocalDateTime expiresAt;

    private LocalDateTime createdAt;

    public enum OtpType {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }
}
