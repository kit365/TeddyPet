package fpt.teddypet;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TeddypetApplication {

    private static final Logger logger = LoggerFactory.getLogger(TeddypetApplication.class);

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
            
            logger.info("✅ Environment variables loaded from .env file");
        } catch (Exception e) {
            logger.warn("⚠️  Could not load .env file: {}", e.getMessage());
            logger.warn("Application will use system environment variables");
        }
    }

}
