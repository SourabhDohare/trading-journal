package com.tradingjournal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableMongoAuditing
@EnableCaching
@EnableScheduling   // ← Required for @Scheduled weekly report job
@EnableAsync        // ← Required for @Async email sending (non-blocking)
public class TradingJournalApplication {
    public static void main(String[] args) {
        SpringApplication.run(TradingJournalApplication.class, args);
    }
}
