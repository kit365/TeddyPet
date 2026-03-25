// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'time_slot_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TimeSlotResponse _$TimeSlotResponseFromJson(Map<String, dynamic> json) =>
    TimeSlotResponse(
      id: (json['id'] as num).toInt(),
      serviceId: (json['serviceId'] as num).toInt(),
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      dayType: json['dayType'] as String?,
      status: json['status'] as String?,
      currentBookings: (json['currentBookings'] as num?)?.toInt(),
      maxCapacity: (json['maxCapacity'] as num?)?.toInt(),
      version: (json['version'] as num?)?.toInt(),
    );

Map<String, dynamic> _$TimeSlotResponseToJson(TimeSlotResponse instance) =>
    <String, dynamic>{
      'id': instance.id,
      'serviceId': instance.serviceId,
      'startTime': instance.startTime,
      'endTime': instance.endTime,
      'dayType': instance.dayType,
      'status': instance.status,
      'currentBookings': instance.currentBookings,
      'maxCapacity': instance.maxCapacity,
      'version': instance.version,
    };
