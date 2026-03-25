import 'package:flutter/material.dart';
import '../../../data/models/entities/notification/notification_entity.dart';
import '../../../data/repositories/notification/notification_repository.dart';
import '../../../data/repositories/notification/notification_repository_impl.dart';

class NotificationProvider with ChangeNotifier {
  final NotificationRepository _notificationRepository = NotificationRepositoryImpl();

  List<NotificationEntity> _notifications = [];
  List<NotificationEntity> get notifications => _notifications;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  Future<void> fetchNotifications({int limit = 20}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _notifications = await _notificationRepository.getMyNotifications(limit: limit);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = "Lỗi khi tải thông báo: $e";
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _notificationRepository.markAllAsRead();
      // Update local state
      _notifications = _notifications.map((n) {
        return NotificationEntity(
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          targetUrl: n.targetUrl,
          isRead: true,
          timestamp: n.timestamp,
        );
      }).toList();
      notifyListeners();
    } catch (e) {
      print("Lỗi khi markAllAsRead: $e");
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _notificationRepository.markAsRead(id);
      // Update local state
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1) {
        final n = _notifications[index];
        _notifications[index] = NotificationEntity(
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          targetUrl: n.targetUrl,
          isRead: true,
          timestamp: n.timestamp,
        );
        notifyListeners();
      }
    } catch (e) {
      print("Lỗi khi markAsRead: $e");
    }
  }
}
