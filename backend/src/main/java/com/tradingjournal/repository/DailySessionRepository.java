package com.tradingjournal.repository;

import com.tradingjournal.model.DailySession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailySessionRepository extends MongoRepository<DailySession, String> {

    // Find a specific day's session for a user
    Optional<DailySession> findByUserIdAndSessionDate(String userId, LocalDate sessionDate);

    // All sessions for a user, newest first
    List<DailySession> findByUserIdOrderBySessionDateDesc(String userId);

    // Sessions in a date range (for history pagination)
    List<DailySession> findByUserIdAndSessionDateBetweenOrderBySessionDateDesc(
            String userId, LocalDate from, LocalDate to);

    // Count for this user
    long countByUserId(String userId);
}
