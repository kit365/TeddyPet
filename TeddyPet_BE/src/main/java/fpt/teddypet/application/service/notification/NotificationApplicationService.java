package fpt.teddypet.application.service.notification;

import fpt.teddypet.application.dto.response.notification.NotificationResponse;
import fpt.teddypet.application.port.input.notification.NotificationService;
import fpt.teddypet.application.port.output.notification.NotificationRepositoryPort;
import fpt.teddypet.domain.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationApplicationService implements NotificationService {

    private final NotificationRepositoryPort repositoryPort;
    private final fpt.teddypet.application.port.output.NotificationPublisherPort publisherPort;

    @Override
    public List<NotificationResponse> getMyNotifications(int limit) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if ("anonymousUser".equals(username)) {
            return new ArrayList<>();
        }

        List<Notification> privateNotifications = repositoryPort.findByRecipientOrderByCreatedAtDesc(username);
        List<Notification> broadcastNotifications = repositoryPort.findBroadcastNotificationsOrderByCreatedAtDesc();

        List<Notification> all = new ArrayList<>();
        all.addAll(privateNotifications);
        all.addAll(broadcastNotifications);

        return all.stream()
                .sorted((n1, n2) -> {
                    if (n1.getCreatedAt() == null)
                        return 1;
                    if (n2.getCreatedAt() == null)
                        return -1;
                    return n2.getCreatedAt().compareTo(n1.getCreatedAt());
                })
                .limit(limit)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if ("anonymousUser".equals(username)) {
            return;
        }
        repositoryPort.markAllAsRead(username);
    }

    @Override
    @Transactional
    public void markAsRead(String id) {
        repositoryPort.findById(id).ifPresent(n -> {
            n.setRead(true);
            repositoryPort.save(n);
        });
    }

    @Override
    public void sendToAll(NotificationResponse notification) {
        publisherPort.sendToAll(notification);
    }

    @Override
    public void sendToUser(String userIdentifier, NotificationResponse notification) {
        publisherPort.sendToUser(userIdentifier, notification);
    }

    @Override
    public void sendToTopic(String topic, NotificationResponse notification) {
        publisherPort.sendToTopic(topic, notification);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .targetUrl(n.getTargetUrl())
                .isRead(n.isRead())
                .timestamp(n.getCreatedAt())
                .build();
    }
}
