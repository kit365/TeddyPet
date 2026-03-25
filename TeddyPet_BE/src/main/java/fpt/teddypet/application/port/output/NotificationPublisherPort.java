package fpt.teddypet.application.port.output;

import fpt.teddypet.application.dto.response.notification.NotificationResponse;

public interface NotificationPublisherPort {
    void sendToAll(NotificationResponse notification);

    void sendToUser(String userIdentifier, NotificationResponse notification);

    void sendToTopic(String topic, NotificationResponse notification);
}
