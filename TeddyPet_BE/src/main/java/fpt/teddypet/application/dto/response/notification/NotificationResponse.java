package fpt.teddypet.application.dto.response.notification;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    @Builder.Default
    private String id = java.util.UUID.randomUUID().toString();
    private String title;
    private String message;
    private String type;
    private String targetUrl;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime timestamp;
}
