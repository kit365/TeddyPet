package fpt.teddypet;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;

@Slf4j
@SpringBootApplication(exclude = {RedisRepositoriesAutoConfiguration.class})
public class TeddypetApplication {

    public static void main(String[] args) {
        // Load .env file before Spring Boot starts
        loadEnvFile();
        
        SpringApplication.run(TeddypetApplication.class, args);
    }

    private static void loadEnvFile() {
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            
            // Load .env variables into System properties for Spring Boot
            dotenv.entries().forEach(entry -> {
                String key = entry.getKey();
                String value = entry.getValue();
                // Only set if not already in system properties (system env takes precedence)
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            });
            
            log.info("✅ Environment variables loaded from .env file");
        } catch (Exception e) {
            log.warn("⚠️  Could not load .env file: {}", e.getMessage());
            log.warn("Application will use system environment variables");
        }
    }

}
