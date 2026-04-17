package com.tradingjournal.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class MongoIndexInitializer implements ApplicationRunner {

    private final MongoTemplate mongo;

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureOtpIndexes();
            ensureTradeIndexes();
            ensureUserIndexes();
            log.info("✓ MongoDB indexes verified.");
        } catch (Exception e) {
            log.error("⚠ MongoDB index initialization failed: {}", e.getMessage(), e);
        }
    }

    private void ensureOtpIndexes() {
        IndexOperations ops = mongo.indexOps("otps");

        // TTL — MongoDB auto-deletes documents when expiresAt is reached
        ops.ensureIndex(new Index()
                .on("expiresAt", Sort.Direction.ASC)
                .expire(0, TimeUnit.SECONDS)
                .named("idx_otps_ttl_expire"));

        // Lookup index — matches OtpService query fields
        ops.ensureIndex(new Index()
                .on("email",  Sort.Direction.ASC)
                .on("type",   Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC)
                .named("idx_otps_email_type_status"));

        // IP rate limiting index
        ops.ensureIndex(new Index()
                .on("requestIp", Sort.Direction.ASC)
                .on("type",      Sort.Direction.ASC)
                .on("status",    Sort.Direction.ASC)
                .named("idx_otps_ip_type_status"));

        log.info("  → OTP indexes ready (TTL + lookup + IP)");
    }

    private void ensureTradeIndexes() {
        IndexOperations ops = mongo.indexOps("trades");

        ops.ensureIndex(new Index()
                .on("userId",    Sort.Direction.ASC)
                .on("tradeDate", Sort.Direction.DESC)
                .named("idx_trades_user_date"));

        ops.ensureIndex(new Index()
                .on("userId",     Sort.Direction.ASC)
                .on("instrument", Sort.Direction.ASC)
                .named("idx_trades_user_instrument"));

        ops.ensureIndex(new Index()
                .on("userId",     Sort.Direction.ASC)
                .on("outcomeTag", Sort.Direction.ASC)
                .named("idx_trades_user_outcome"));

        log.info("  → Trade indexes ready");
    }

    private void ensureUserIndexes() {
        IndexOperations ops = mongo.indexOps("users");

        ops.ensureIndex(new Index()
                .on("email", Sort.Direction.ASC)
                .unique()
                .named("idx_users_email_unique"));

        log.info("  → User indexes ready");
    }
}