package fpt.teddypet.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Dev-only config to automatically repair Flyway metadata when a migration
 * script (for example V1__baseline.sql) has been modified after being applied.
 *
 * This avoids "checksum mismatch" errors on local machines, but is scoped to
 * the "dev" profile so that production environments are not affected.
 */
@Configuration
@Profile("dev")
public class FlywayDevRepairConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return (Flyway flyway) -> {
            // Align flyway_schema_history checksums with current migration scripts
            flyway.repair();
            // Then run normal migration
            flyway.migrate();
        };
    }
}
