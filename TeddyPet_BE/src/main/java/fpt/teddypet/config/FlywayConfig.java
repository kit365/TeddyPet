package fpt.teddypet.config;

import org.flywaydb.core.api.exception.FlywayValidateException;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;

/**
 * Khi pull code về, file migration có thể đã đổi (checksum khác với bản từng apply trên DB).
 * Strategy này: nếu validate fail thì chạy repair (cập nhật checksum trong flyway_schema_history)
 * rồi migrate lại, giúp app khởi động được mà không cần chạy flyway repair tay.
 */
@Slf4j
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                flyway.migrate();
            } catch (FlywayValidateException e) {
                log.warn("Flyway validation failed (checksum mismatch after pull). Running repair then migrate: {}", e.getMessage());
                flyway.repair();
                flyway.migrate();
            }
        };
    }
}
