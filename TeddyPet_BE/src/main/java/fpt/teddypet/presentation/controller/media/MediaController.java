package fpt.teddypet.presentation.controller.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Media", description = "Media management APIs")
public class MediaController {

    private final Cloudinary cloudinary;

    @GetMapping("/test-connection")
    @Operation(summary = "Test Cloudinary connection", description = "Verifies if the Cloudinary configuration is working by pinging the service.")
    public ResponseEntity<Map<String, Object>> testConnection() {
        try {
            // Check if cloud name is loaded
            if (cloudinary.config.cloudName == null) {
                return ResponseEntity.status(400).body(Map.of(
                        "status", "error",
                        "message", "CLOUDINARY_URL not found or invalid"));
            }

            // Ping Cloudinary
            cloudinary.api().resourceTypes(ObjectUtils.emptyMap());

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Cloudinary connection successful!",
                    "cloud_name", cloudinary.config.cloudName));
        } catch (Exception e) {
            log.error("Cloudinary connection failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "Cloudinary connection failed: " + e.getMessage(),
                    "cloud_name", cloudinary.config.cloudName != null ? cloudinary.config.cloudName : "null"));
        }
    }

    @GetMapping("/config")
    @Operation(summary = "Get Cloudinary configuration", description = "Provides Cloudinary credentials for frontend use.")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of(
                "cloud_name", cloudinary.config.cloudName != null ? cloudinary.config.cloudName : "",
                "api_key", cloudinary.config.apiKey != null ? cloudinary.config.apiKey : "",
                "api_secret", cloudinary.config.apiSecret != null ? cloudinary.config.apiSecret : ""));
    }
}
