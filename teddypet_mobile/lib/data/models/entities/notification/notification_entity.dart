class NotificationEntity {
  final String id;
  final String title;
  final String message;
  final String type;
  final String? targetUrl;
  final bool isRead;
  final DateTime timestamp;

  NotificationEntity({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    this.targetUrl,
    required this.isRead,
    required this.timestamp,
  });

  factory NotificationEntity.fromJson(Map<String, dynamic> json) {
    return NotificationEntity(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? '',
      targetUrl: json['targetUrl'],
      isRead: json['isRead'] ?? false,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type,
      'targetUrl': targetUrl,
      'isRead': isRead,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
