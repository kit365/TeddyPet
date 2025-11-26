package fpt.teddypet.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;

import java.net.URI;
import java.time.Duration;
import java.util.Arrays;

@Configuration
public class ElasticsearchConfig extends ElasticsearchConfiguration {

    @Value("${spring.elasticsearch.uris}")
    private String elasticsearchUris;

    @Value("${spring.elasticsearch.connection-timeout:5s}")
    private String connectionTimeout;

    @Value("${spring.elasticsearch.socket-timeout:60s}")
    private String socketTimeout;

    @Override
    public ClientConfiguration clientConfiguration() {
        String[] hosts = Arrays.stream(elasticsearchUris.split(","))
                .map(uri -> {
                    try {
                        // Remove trailing slash if present
                        String cleanedUri = uri.trim();
                        if (cleanedUri.endsWith("/")) {
                            cleanedUri = cleanedUri.substring(0, cleanedUri.length() - 1);
                        }
                        
                        URI parsedUri = URI.create(cleanedUri);
                        String host = parsedUri.getHost();
                        int port = parsedUri.getPort() != -1 ? parsedUri.getPort() : 9200;
                        return host + ":" + port;
                    } catch (Exception e) {
                        // Fallback: remove protocol prefix and trailing slash
                        String cleaned = uri.trim()
                                .replace("http://", "")
                                .replace("https://", "");
                        if (cleaned.endsWith("/")) {
                            cleaned = cleaned.substring(0, cleaned.length() - 1);
                        }
                        return cleaned.contains(":") ? cleaned : cleaned + ":9200";
                    }
                })
                .toArray(String[]::new);

        return ClientConfiguration.builder()
                .connectedTo(hosts)
                .withConnectTimeout(parseDuration(connectionTimeout))
                .withSocketTimeout(parseDuration(socketTimeout))
                .build();
    }

    private Duration parseDuration(String duration) {
        if (duration == null || duration.isEmpty()) {
            return Duration.ofSeconds(5);
        }
        String trimmed = duration.trim();
        if (trimmed.endsWith("s")) {
            try {
                return Duration.ofSeconds(Long.parseLong(trimmed.substring(0, trimmed.length() - 1)));
            } catch (NumberFormatException e) {
                return Duration.ofSeconds(5);
            }
        } else if (trimmed.endsWith("ms")) {
            try {
                return Duration.ofMillis(Long.parseLong(trimmed.substring(0, trimmed.length() - 2)));
            } catch (NumberFormatException e) {
                return Duration.ofSeconds(5);
            }
        }
        return Duration.ofSeconds(5);
    }
}

