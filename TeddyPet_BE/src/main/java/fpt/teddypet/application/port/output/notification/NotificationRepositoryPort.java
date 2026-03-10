package fpt.teddypet.application.port.output.notification;

import fpt.teddypet.domain.entity.Notification;
import java.util.List;
import java.util.Optional;

public interface NotificationRepositoryPort {
    Notification save(Notification notification);

    List<Notification> findByRecipientOrderByCreatedAtDesc(String recipient);

    List<Notification> findBroadcastNotificationsOrderByCreatedAtDesc();

    void markAllAsRead(String recipient);

    Optional<Notification> findById(String id);

    void markAsRead(String id);
}
