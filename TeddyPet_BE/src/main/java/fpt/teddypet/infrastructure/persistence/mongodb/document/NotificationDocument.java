package fpt.teddypet.infrastructure.persistence.mongodb.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDocument {

    @Id
    private String id;

    private String title;
    private String message;
    private String type;
    private String targetUrl;
    private String recipient; // null for broadcast

    @Builder.Default
    private boolean isRead = false;

    @Builder.Default
    private boolean isDeleted = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
