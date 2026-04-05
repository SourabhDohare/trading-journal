package com.tradingjournal.repository;

import com.tradingjournal.model.Trade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TradeRepository extends MongoRepository<Trade, String> {

    Page<Trade> findByUserIdOrderByTradeDateDesc(String userId, Pageable pageable);

    Optional<Trade> findByIdAndUserId(String id, String userId);

    List<Trade> findByUserIdAndTradeDateBetweenOrderByTradeDateDesc(
            String userId, LocalDateTime start, LocalDateTime end);

    List<Trade> findByUserIdAndOutcomeTag(String userId, Trade.OutcomeTag outcomeTag);

    @Query("{'userId': ?0, 'tags': {$in: ?1}}")
    List<Trade> findByUserIdAndTagsIn(String userId, List<String> tags);

    @Query("{'userId': ?0, 'actualRR': {$gte: ?1}}")
    List<Trade> findByUserIdAndActualRRGreaterThanEqual(String userId, Double minRR);

    @Query("{'userId': ?0, 'slRespected': false}")
    List<Trade> findSlBreaches(String userId);

    @Query("{'userId': ?0, 'emotionalState': ?1}")
    List<Trade> findByUserIdAndEmotionalState(String userId, Trade.EmotionalState state);

    @Query("{'userId': ?0, 'setupType': ?1}")
    List<Trade> findByUserIdAndSetupType(String userId, Trade.SetupType setupType);

    @Query(value = "{'userId': ?0}", sort = "{'tradeDate': -1}")
    List<Trade> findLastNTrades(String userId, Pageable pageable);

    long countByUserIdAndOutcomeTag(String userId, Trade.OutcomeTag outcomeTag);

    long countByUserId(String userId);

    @Query("{'userId': ?0, 'instrument': ?1}")
    List<Trade> findByUserIdAndInstrument(String userId, String instrument);

    boolean existsByTradeIdAndUserId(String tradeId, String userId);
}
