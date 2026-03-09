package fpt.teddypet.application.port.input.notification;

import fpt.teddypet.application.dto.response.notification.NotificationResponse;
import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(int limit);

    void markAllAsRead();
}
