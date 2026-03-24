import '../../models/entities/notification/notification_entity.dart';

abstract class NotificationRepository {
  Future<List<NotificationEntity>> getMyNotifications({int limit = 20});
  Future<void> markAllAsRead();
  Future<void> markAsRead(String id);
}
