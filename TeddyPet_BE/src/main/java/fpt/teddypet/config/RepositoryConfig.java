package fpt.teddypet.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Configuration to separate JPA and MongoDB repositories
 * This prevents Spring Data from scanning wrong repository types
 */
@Configuration
@EnableJpaRepositories(basePackages = "fpt.teddypet.infrastructure.persistence.postgres.repository")
@EnableMongoRepositories(basePackages = "fpt.teddypet.infrastructure.persistence.mongodb.repository")
@EntityScan(basePackages = "fpt.teddypet.domain.entity")
public class RepositoryConfig {
}

