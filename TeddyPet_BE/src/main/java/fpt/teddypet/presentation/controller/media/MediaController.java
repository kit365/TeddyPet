package fpt.teddypet.presentation.controller.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import fpt.teddypet.application.dto.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

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

    @PostMapping("/upload")
    @Operation(summary = "Upload ảnh lên Cloudinary", description = "Upload một file ảnh (dùng cho ảnh đại diện thú cưng, v.v.). Trả về URL công khai.")
    public ResponseEntity<ApiResponse<String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "pet-avatars") String folder) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chưa chọn file ảnh."));
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ chấp nhận file ảnh (image/*)."));
        }
        File tempFile = null;
        try {
            tempFile = File.createTempFile("upload_", "_" + file.getOriginalFilename());
            try (FileOutputStream out = new FileOutputStream(tempFile)) {
                out.write(file.getBytes());
            }
            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", folder,
                    "public_id", "pet_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
                    "overwrite", false
            );
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(tempFile, params);
            String url = (String) result.get("secure_url");
            if (url == null) {
                url = (String) result.get("url");
            }
            return ResponseEntity.ok(ApiResponse.success("Upload thành công.", url));
        } catch (IOException e) {
            log.error("Upload failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error("Không thể tải ảnh lên."));
        } catch (Exception e) {
            log.error("Cloudinary upload error: {}", e.getMessage());
            String msg = e.getMessage() != null && e.getMessage().toLowerCase().contains("api_key")
                    ? "Hệ thống chưa cấu hình lưu trữ ảnh. Vui lòng liên hệ quản trị viên."
                    : "Tải ảnh lên thất bại. Vui lòng thử lại.";
            return ResponseEntity.internalServerError().body(ApiResponse.error(msg));
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}
