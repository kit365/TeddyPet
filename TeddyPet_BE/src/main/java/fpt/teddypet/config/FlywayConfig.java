package fpt.teddypet.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class FlywayConfig {

    /**
     * Runs {@link Flyway#repair()} before migrate when:
     * <ul>
     *   <li>{@code spring.flyway.repair-on-migrate=true} (profiles dev/local/env), or</li>
     *   <li>JDBC URL points at this machine ({@code localhost} / {@code 127.0.0.1}) — typical IntelliJ + local Postgres while {@code prod} profile is active.</li>
     * </ul>
     * Docker/production URLs ({@code postgres:5432}, RDS, etc.) skip auto-repair unless explicitly enabled.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(Environment env) {
        return flyway -> {
            boolean explicit = Boolean.TRUE.equals(env.getProperty("spring.flyway.repair-on-migrate", Boolean.class));
            String url = env.getProperty("spring.datasource.url", "");
            boolean localJdbc = containsIgnoreCase(url, "localhost") || containsIgnoreCase(url, "127.0.0.1");
            if (explicit || localJdbc) {
                System.out.println(">>> [FLYWAY] Running repair (repair-on-migrate=" + explicit + ", localJdbc=" + localJdbc + ")...");
                flyway.repair();
                System.out.println(">>> [FLYWAY] Repair completed.");
            } else {
                System.out.println(">>> [FLYWAY] Skipping repair (non-local datasource).");
            }
            flyway.migrate();
        };
    }

    private static boolean containsIgnoreCase(String haystack, String needle) {
        return haystack != null && haystack.toLowerCase().contains(needle.toLowerCase());
    }
}
