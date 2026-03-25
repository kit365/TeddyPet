import 'package:json_annotation/json_annotation.dart';

part 'booking_response.g.dart';

@JsonSerializable()
class ClientBookingDetailResponse {
  final int id;
  final String bookingCode;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String? customerAddress;
  final String bookingType;
  final double totalAmount;
  final double paidAmount;
  final double remainingAmount;
  final bool? depositPaid;
  final String paymentStatus;
  final String? paymentMethod;
  final String status;
  final String? internalNotes;
  final bool? cancelRequested;
  final String? cancelledReason;
  final int? depositId;
  final DateTime? depositExpiresAt;
  final DateTime? bookingCheckInDate;
  final DateTime? bookingCheckOutDate;
  final DateTime createdAt;
  final List<ClientBookingPetDetailResponse>? pets;

  ClientBookingDetailResponse({
    required this.id,
    required this.bookingCode,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    this.customerAddress,
    required this.bookingType,
    required this.totalAmount,
    required this.paidAmount,
    required this.remainingAmount,
    this.depositPaid,
    required this.paymentStatus,
    this.paymentMethod,
    required this.status,
    this.internalNotes,
    this.cancelRequested,
    this.cancelledReason,
    this.depositId,
    this.depositExpiresAt,
    this.bookingCheckInDate,
    this.bookingCheckOutDate,
    required this.createdAt,
    this.pets,
  });

  factory ClientBookingDetailResponse.fromJson(Map<String, dynamic> json) =>
      _$ClientBookingDetailResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ClientBookingDetailResponseToJson(this);
}

@JsonSerializable()
class ClientBookingPetDetailResponse {
  final int id;
  final String petName;
  final String petType;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final double? weightAtBooking;
  final String? petConditionNotes;
  final String? arrivalCondition;
  final String? departureCondition;
  final String? arrivalPhotos;
  final String? departurePhotos;
  final String? belongingPhotos;
  final String? foodBrought;
  final List<ClientBookingPetServiceDetailResponse>? services;
  final List<ClientPetFoodBroughtDetailResponse>? foodItems;

  ClientBookingPetDetailResponse({
    required this.id,
    required this.petName,
    required this.petType,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.weightAtBooking,
    this.petConditionNotes,
    this.arrivalCondition,
    this.departureCondition,
    this.arrivalPhotos,
    this.departurePhotos,
    this.belongingPhotos,
    this.foodBrought,
    this.services,
    this.foodItems,
  });

  factory ClientBookingPetDetailResponse.fromJson(Map<String, dynamic> json) =>
      _$ClientBookingPetDetailResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ClientBookingPetDetailResponseToJson(this);
}

@JsonSerializable()
class ClientBookingPetServiceDetailResponse {
  final int id;
  final List<int>? assignedStaffIds;
  final String? assignedStaffNames;
  final String serviceName;
  final String? timeSlotName;
  final DateTime? estimatedCheckInDate;
  final DateTime? estimatedCheckOutDate;
  final DateTime? actualCheckInDate;
  final DateTime? actualCheckOutDate;
  final int? numberOfNights;
  final DateTime? scheduledStartTime;
  final DateTime? scheduledEndTime;
  final DateTime? actualStartTime;
  final DateTime? actualEndTime;
  final double basePrice;
  final double subtotal;
  final String status;
  final String? staffNotes;
  final String? beforePhotos;
  final String? duringPhotos;
  final String? afterPhotos;
  final int? customerRating;
  final String? customerReview;
  final String? customerReviewPhotos;
  final int? roomId;
  final String? roomName;
  final String? displayTypeName;
  final String? roomNumber;
  final List<ClientBookingPetServiceItemDetailResponse>? items;

  ClientBookingPetServiceDetailResponse({
    required this.id,
    this.assignedStaffIds,
    this.assignedStaffNames,
    required this.serviceName,
    this.timeSlotName,
    this.estimatedCheckInDate,
    this.estimatedCheckOutDate,
    this.actualCheckInDate,
    this.actualCheckOutDate,
    this.numberOfNights,
    this.scheduledStartTime,
    this.scheduledEndTime,
    this.actualStartTime,
    this.actualEndTime,
    required this.basePrice,
    required this.subtotal,
    required this.status,
    this.staffNotes,
    this.beforePhotos,
    this.duringPhotos,
    this.afterPhotos,
    this.customerRating,
    this.customerReview,
    this.customerReviewPhotos,
    this.roomId,
    this.roomName,
    this.displayTypeName,
    this.roomNumber,
    this.items,
  });

  factory ClientBookingPetServiceDetailResponse.fromJson(Map<String, dynamic> json) =>
      _$ClientBookingPetServiceDetailResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ClientBookingPetServiceDetailResponseToJson(this);
}

@JsonSerializable()
class ClientBookingPetServiceItemDetailResponse {
  final int id;
  final String? itemName;
  final int? quantity;
  final double? price;
  final double? subtotal;

  ClientBookingPetServiceItemDetailResponse({
    required this.id,
    this.itemName,
    this.quantity,
    this.price,
    this.subtotal,
  });

  factory ClientBookingPetServiceItemDetailResponse.fromJson(Map<String, dynamic> json) =>
      _$ClientBookingPetServiceItemDetailResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ClientBookingPetServiceItemDetailResponseToJson(this);
}

@JsonSerializable()
class ClientPetFoodBroughtDetailResponse {
  final int id;
  final String? foodBroughtType;
  final String? foodBrand;
  final int? quantity;
  final String? feedingInstructions;

  ClientPetFoodBroughtDetailResponse({
    required this.id,
    this.foodBroughtType,
    this.foodBrand,
    this.quantity,
    this.feedingInstructions,
  });

  factory ClientPetFoodBroughtDetailResponse.fromJson(Map<String, dynamic> json) =>
      _$ClientPetFoodBroughtDetailResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ClientPetFoodBroughtDetailResponseToJson(this);
}

@JsonSerializable()
class CreateBookingResponse {
  final String bookingCode;

  CreateBookingResponse({required this.bookingCode});

  factory CreateBookingResponse.fromJson(Map<String, dynamic> json) =>
      _$CreateBookingResponseFromJson(json);

  Map<String, dynamic> toJson() => _$CreateBookingResponseToJson(this);
}
