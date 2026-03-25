package fpt.teddypet.infrastructure.adapter.notification;

import fpt.teddypet.application.dto.response.notification.NotificationResponse;
import fpt.teddypet.application.port.output.NotificationPublisherPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketNotificationAdapter implements NotificationPublisherPort {

    private final SimpMessagingTemplate messagingTemplate;
    private final fpt.teddypet.application.port.output.notification.NotificationRepositoryPort repositoryPort;

    @Override
    public void sendToAll(NotificationResponse notification) {
        log.info("Sending notification to all: {}", notification.getTitle());
        NotificationResponse saved = saveNotification(notification, null);
        messagingTemplate.convertAndSend("/topic/public", saved);
    }

    @Override
    public void sendToUser(String userIdentifier, NotificationResponse notification) {
        log.info("Sending notification to user {}: {}", userIdentifier, notification.getTitle());
        NotificationResponse saved = saveNotification(notification, userIdentifier);
        messagingTemplate.convertAndSendToUser(userIdentifier, "/queue/notifications", saved);
    }

    @Override
    public void sendToTopic(String topic, NotificationResponse notification) {
        log.info("Sending notification to topic {}: {}", topic, notification.getTitle());
        NotificationResponse saved = saveNotification(notification, null);
        messagingTemplate.convertAndSend("/topic/" + topic, saved);
    }

    private NotificationResponse saveNotification(NotificationResponse res, String recipient) {
        try {
            fpt.teddypet.domain.entity.Notification entity = fpt.teddypet.domain.entity.Notification.builder()
                    .title(res.getTitle())
                    .message(res.getMessage())
                    .type(res.getType())
                    .targetUrl(res.getTargetUrl())
                    .recipient(recipient)
                    .isRead(false)
                    .createdAt(res.getTimestamp() != null ? res.getTimestamp() : java.time.LocalDateTime.now())
                    .build();
            fpt.teddypet.domain.entity.Notification savedEntity = repositoryPort.save(entity);

            return NotificationResponse.builder()
                    .id(savedEntity.getId())
                    .title(savedEntity.getTitle())
                    .message(savedEntity.getMessage())
                    .type(savedEntity.getType())
                    .targetUrl(savedEntity.getTargetUrl())
                    .timestamp(savedEntity.getCreatedAt())
                    .isRead(savedEntity.isRead())
                    .build();
        } catch (Exception e) {
            log.error("Failed to save notification to DB", e);
            return res;
        }
    }
}
