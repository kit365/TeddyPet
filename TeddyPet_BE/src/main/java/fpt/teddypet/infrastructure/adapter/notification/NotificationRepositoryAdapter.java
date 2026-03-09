package fpt.teddypet.infrastructure.adapter.notification;

import fpt.teddypet.application.port.output.notification.NotificationRepositoryPort;
import fpt.teddypet.domain.entity.Notification;
import fpt.teddypet.infrastructure.persistence.mongodb.document.NotificationDocument;
import fpt.teddypet.infrastructure.persistence.mongodb.repository.NotificationMongoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class NotificationRepositoryAdapter implements NotificationRepositoryPort {

    private final NotificationMongoRepository repository;

    @Override
    public Notification save(Notification notification) {
        NotificationDocument doc = toDocument(notification);
        NotificationDocument saved = repository.save(doc);
        return toEntity(saved);
    }

    @Override
    public List<Notification> findByRecipientOrderByCreatedAtDesc(String recipient) {
        return repository.findByRecipientAndIsDeletedFalseOrderByCreatedAtDesc(recipient)
                .stream().map(this::toEntity).collect(Collectors.toList());
    }

    @Override
    public List<Notification> findBroadcastNotificationsOrderByCreatedAtDesc() {
        return repository.findByRecipientIsNullAndIsDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::toEntity).collect(Collectors.toList());
    }

    @Override
    public void markAllAsRead(String recipient) {
        List<NotificationDocument> unread = repository.findByRecipientAndIsDeletedFalseOrderByCreatedAtDesc(recipient);
        unread.stream().filter(n -> !n.isRead()).forEach(n -> {
            n.setRead(true);
            repository.save(n);
        });
    }

    @Override
    public Optional<Notification> findById(String id) {
        return repository.findById(id).map(this::toEntity);
    }

    private NotificationDocument toDocument(Notification n) {
        return NotificationDocument.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .targetUrl(n.getTargetUrl())
                .recipient(n.getRecipient())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private Notification toEntity(NotificationDocument d) {
        return Notification.builder()
                .id(d.getId())
                .title(d.getTitle())
                .message(d.getMessage())
                .type(d.getType())
                .targetUrl(d.getTargetUrl())
                .recipient(d.getRecipient())
                .isRead(d.isRead())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
