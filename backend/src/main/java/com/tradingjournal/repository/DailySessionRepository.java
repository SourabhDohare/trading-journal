package com.tradingjournal.repository;

import com.tradingjournal.model.DailySession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailySessionRepository extends MongoRepository<DailySession, String> {
    Optional<DailySession> findByUserIdAndSessionDate(String userId, LocalDate date);
    List<DailySession> findByUserIdOrderBySessionDateDesc(String userId);
    List<DailySession> findByUserIdAndSessionDateBetween(String userId, LocalDate from, LocalDate to);
}
