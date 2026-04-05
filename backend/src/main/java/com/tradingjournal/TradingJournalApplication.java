package com.tradingjournal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableMongoAuditing
@EnableCaching
@EnableAsync
public class TradingJournalApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradingJournalApplication.class, args);
    }
}
