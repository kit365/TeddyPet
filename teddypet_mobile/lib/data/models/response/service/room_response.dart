import 'package:json_annotation/json_annotation.dart';

part 'room_response.g.dart';

@JsonSerializable()
class RoomLayoutConfigResponse {
  final int id;
  final String? layoutName;
  final int maxRows;
  final int maxCols;
  final String? backgroundImage;
  final String? status;
  final int? serviceId;
  final String? serviceName;

  RoomLayoutConfigResponse({
    required this.id,
    this.layoutName,
    required this.maxRows,
    required this.maxCols,
    this.backgroundImage,
    this.status,
    this.serviceId,
    this.serviceName,
  });

  factory RoomLayoutConfigResponse.fromJson(Map<String, dynamic> json) =>
      _$RoomLayoutConfigResponseFromJson(json);

  Map<String, dynamic> toJson() => _$RoomLayoutConfigResponseToJson(this);
}

@JsonSerializable()
class RoomResponse {
  final int roomId;
  final int roomTypeId;
  final String? roomTypeName;
  final String roomNumber;
  final String? roomName;
  final String? tier;
  final int? gridRow;
  final int? gridCol;
  final bool? isSorted;
  final int? roomLayoutConfigId;
  final int? capacity;
  final String status;
  final bool isActive;
  final String? additionalAmenities;
  final String? images;
  final String? notes;
  final double? area;

  RoomResponse({
    required this.roomId,
    required this.roomTypeId,
    this.roomTypeName,
    required this.roomNumber,
    this.roomName,
    this.tier,
    this.gridRow,
    this.gridCol,
    this.isSorted,
    this.roomLayoutConfigId,
    this.capacity,
    required this.status,
    required this.isActive,
    this.additionalAmenities,
    this.images,
    this.notes,
    this.area,
  });

  factory RoomResponse.fromJson(Map<String, dynamic> json) =>
      _$RoomResponseFromJson(json);

  Map<String, dynamic> toJson() => _$RoomResponseToJson(this);
}

@JsonSerializable()
class RoomTypeResponse {
  final int roomTypeId;
  final String typeName;
  final String? displayTypeName;
  final bool isActive;
  final bool? isDeleted;

  RoomTypeResponse({
    required this.roomTypeId,
    required this.typeName,
    this.displayTypeName,
    required this.isActive,
    this.isDeleted,
  });

  factory RoomTypeResponse.fromJson(Map<String, dynamic> json) =>
      _$RoomTypeResponseFromJson(json);

  Map<String, dynamic> toJson() => _$RoomTypeResponseToJson(this);
}
