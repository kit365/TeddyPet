package fpt.teddypet.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class FlywayConfig {

    @Value("${spring.flyway.repair-on-migrate:false}")
    private boolean repairOnMigrate;

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            if (repairOnMigrate) {
                System.out.println(">>> [FLYWAY] repairOnMigrate is TRUE. Running repair...");
                flyway.repair();
                System.out.println(">>> [FLYWAY] Repair completed!");
            } else {
                System.out.println(">>> [FLYWAY] repairOnMigrate is FALSE. Normal migration...");
            }
            flyway.migrate();
        };
    }
}
