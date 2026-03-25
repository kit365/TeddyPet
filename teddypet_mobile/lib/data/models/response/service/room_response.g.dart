// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'room_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RoomLayoutConfigResponse _$RoomLayoutConfigResponseFromJson(
  Map<String, dynamic> json,
) => RoomLayoutConfigResponse(
  id: (json['id'] as num).toInt(),
  layoutName: json['layoutName'] as String?,
  maxRows: (json['maxRows'] as num).toInt(),
  maxCols: (json['maxCols'] as num).toInt(),
  backgroundImage: json['backgroundImage'] as String?,
  status: json['status'] as String?,
  serviceId: (json['serviceId'] as num?)?.toInt(),
  serviceName: json['serviceName'] as String?,
);

Map<String, dynamic> _$RoomLayoutConfigResponseToJson(
  RoomLayoutConfigResponse instance,
) => <String, dynamic>{
  'id': instance.id,
  'layoutName': instance.layoutName,
  'maxRows': instance.maxRows,
  'maxCols': instance.maxCols,
  'backgroundImage': instance.backgroundImage,
  'status': instance.status,
  'serviceId': instance.serviceId,
  'serviceName': instance.serviceName,
};

RoomResponse _$RoomResponseFromJson(Map<String, dynamic> json) => RoomResponse(
  roomId: (json['roomId'] as num).toInt(),
  roomTypeId: (json['roomTypeId'] as num).toInt(),
  roomTypeName: json['roomTypeName'] as String?,
  roomNumber: json['roomNumber'] as String,
  roomName: json['roomName'] as String?,
  tier: json['tier'] as String?,
  gridRow: (json['gridRow'] as num?)?.toInt(),
  gridCol: (json['gridCol'] as num?)?.toInt(),
  isSorted: json['isSorted'] as bool?,
  roomLayoutConfigId: (json['roomLayoutConfigId'] as num?)?.toInt(),
  capacity: (json['capacity'] as num?)?.toInt(),
  status: json['status'] as String,
  isActive: json['isActive'] as bool,
  additionalAmenities: json['additionalAmenities'] as String?,
  images: json['images'] as String?,
  notes: json['notes'] as String?,
  area: (json['area'] as num?)?.toDouble(),
);

Map<String, dynamic> _$RoomResponseToJson(RoomResponse instance) =>
    <String, dynamic>{
      'roomId': instance.roomId,
      'roomTypeId': instance.roomTypeId,
      'roomTypeName': instance.roomTypeName,
      'roomNumber': instance.roomNumber,
      'roomName': instance.roomName,
      'tier': instance.tier,
      'gridRow': instance.gridRow,
      'gridCol': instance.gridCol,
      'isSorted': instance.isSorted,
      'roomLayoutConfigId': instance.roomLayoutConfigId,
      'capacity': instance.capacity,
      'status': instance.status,
      'isActive': instance.isActive,
      'additionalAmenities': instance.additionalAmenities,
      'images': instance.images,
      'notes': instance.notes,
      'area': instance.area,
    };

RoomTypeResponse _$RoomTypeResponseFromJson(Map<String, dynamic> json) =>
    RoomTypeResponse(
      roomTypeId: (json['roomTypeId'] as num).toInt(),
      typeName: json['typeName'] as String,
      displayTypeName: json['displayTypeName'] as String?,
      isActive: json['isActive'] as bool,
      isDeleted: json['isDeleted'] as bool?,
    );

Map<String, dynamic> _$RoomTypeResponseToJson(RoomTypeResponse instance) =>
    <String, dynamic>{
      'roomTypeId': instance.roomTypeId,
      'typeName': instance.typeName,
      'displayTypeName': instance.displayTypeName,
      'isActive': instance.isActive,
      'isDeleted': instance.isDeleted,
    };
