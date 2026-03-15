package fpt.teddypet;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Guardian Test: This test ensures that the Spring context can load successfully
 * and that all Flyway migrations run without errors.
 * If any SQL migration is broken, this test will fail and block the CI/CD pipeline.
 */
@SpringBootTest
@ActiveProfiles("ci")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;NON_KEYWORDS=MONTH",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class FlywayMigrationTest {

    @Test
    void verifyMigrations() {
        // The test will fail during context initialization if Flyway migration fails.
        // We can add additional checks here if needed.
        System.out.println("Flyway migrations verified successfully!");
    }
}
