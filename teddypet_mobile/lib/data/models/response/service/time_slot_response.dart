import 'package:json_annotation/json_annotation.dart';

part 'time_slot_response.g.dart';

@JsonSerializable()
class TimeSlotResponse {
  final int id;
  final int serviceId;
  final String startTime;
  final String endTime;
  final String? dayType;
  final String? status;
  final int? currentBookings;
  final int? maxCapacity;
  final int? version;

  TimeSlotResponse({
    required this.id,
    required this.serviceId,
    required this.startTime,
    required this.endTime,
    this.dayType,
    this.status,
    this.currentBookings,
    this.maxCapacity,
    this.version,
  });

  factory TimeSlotResponse.fromJson(Map<String, dynamic> json) =>
      _$TimeSlotResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TimeSlotResponseToJson(this);
}
