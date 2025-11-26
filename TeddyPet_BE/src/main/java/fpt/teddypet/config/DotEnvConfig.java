package fpt.teddypet.config;

import org.springframework.context.annotation.Configuration;


@Configuration
public class DotEnvConfig {

    public static String get(String key) {
        // Try system property first (from .env file)
        String value = System.getProperty(key);
        if (value != null) {
            return value;
        }
        // Fallback to system environment variable
        return System.getenv(key);
    }


    public static String get(String key, String defaultValue) {
        String value = get(key);
        return value != null ? value : defaultValue;
    }
}

