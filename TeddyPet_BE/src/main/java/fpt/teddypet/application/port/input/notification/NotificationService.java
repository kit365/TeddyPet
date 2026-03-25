package fpt.teddypet.application.port.input.notification;

import fpt.teddypet.application.dto.response.notification.NotificationResponse;
import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(int limit);

    void markAllAsRead();

    void markAsRead(String id);

    void sendToAll(NotificationResponse notification);

    void sendToUser(String userIdentifier, NotificationResponse notification);

    void sendToTopic(String topic, NotificationResponse notification);
}
