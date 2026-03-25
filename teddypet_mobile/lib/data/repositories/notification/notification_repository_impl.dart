import '../../../core/network/api_client.dart';
import '../../models/entities/notification/notification_entity.dart';
import 'notification_repository.dart';

class NotificationRepositoryImpl implements NotificationRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = 'notifications';

  @override
  Future<List<NotificationEntity>> getMyNotifications({int limit = 20}) async {
    try {
      final response = await _apiClient.get<List<NotificationEntity>>(
        _baseEndpoint,
        queryParameters: {'limit': limit},
        fromJson: (json) => (json as List)
            .map((item) => NotificationEntity.fromJson(item))
            .toList(),
      );

      return response.data ?? [];
    } catch (e) {
      print("Lỗi khi getMyNotifications: $e");
      return [];
    }
  }

  @override
  Future<void> markAllAsRead() async {
    try {
      await _apiClient.put('$_baseEndpoint/mark-as-read');
    } catch (e) {
      print("Lỗi khi markAllAsRead: $e");
    }
  }

  @override
  Future<void> markAsRead(String id) async {
    try {
      await _apiClient.put('$_baseEndpoint/mark-as-read/$id');
    } catch (e) {
      print("Lỗi khi markAsRead: $e");
    }
  }
}
