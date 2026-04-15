package com.tradingjournal.repository;

import com.tradingjournal.model.Otp;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpRepository extends MongoRepository<Otp, String> {

    // Find the latest unused, non-expired OTP for email+type
    Optional<Otp> findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(
            String email, Otp.OtpType type);

    // Delete all OTPs for this email+type before issuing a new one
    void deleteAllByEmailAndType(String email, Otp.OtpType type);

    // Check if any active OTP exists (rate limiting)
    boolean existsByEmailAndTypeAndUsedFalse(String email, Otp.OtpType type);
}
