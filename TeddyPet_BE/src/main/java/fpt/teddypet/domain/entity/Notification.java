package fpt.teddypet.domain.entity;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    private String id;
    private String title;
    private String message;
    private String type;
    private String targetUrl;
    private String recipient;
    private boolean isRead;
    private LocalDateTime createdAt;
}
