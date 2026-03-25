import 'package:json_annotation/json_annotation.dart';

part 'create_booking_request.g.dart';

@JsonSerializable()
class CreateBookingRequest {
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String? customerAddress;
  final String? note;
  final String? source;
  final String bookingType;
  final List<CreateBookingPetRequest> pets;

  CreateBookingRequest({
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    this.customerAddress,
    this.note,
    this.source,
    required this.bookingType,
    required this.pets,
  });

  factory CreateBookingRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateBookingRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateBookingRequestToJson(this);
}

@JsonSerializable()
class CreateBookingPetRequest {
  final String petName;
  final String petType;
  final double? weightAtBooking;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? petConditionNotes;
  final List<CreateBookingPetServiceRequest> services;
  final List<PetFoodBroughtItemRequest>? foodItems;

  CreateBookingPetRequest({
    required this.petName,
    required this.petType,
    this.weightAtBooking,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.petConditionNotes,
    required this.services,
    this.foodItems,
  });

  factory CreateBookingPetRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateBookingPetRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateBookingPetRequestToJson(this);
}

@JsonSerializable()
class CreateBookingPetServiceRequest {
  final int serviceId;
  final bool requiresRoom;
  final String? checkInDate;
  final String? checkOutDate;
  final int? roomId;
  final String? sessionDate;
  final String? sessionSlotLabel;
  final int? timeSlotId;
  final List<int>? addonServiceIds;

  CreateBookingPetServiceRequest({
    required this.serviceId,
    required this.requiresRoom,
    this.checkInDate,
    this.checkOutDate,
    this.roomId,
    this.sessionDate,
    this.sessionSlotLabel,
    this.timeSlotId,
    this.addonServiceIds,
  });

  factory CreateBookingPetServiceRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateBookingPetServiceRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateBookingPetServiceRequestToJson(this);
}

@JsonSerializable()
class PetFoodBroughtItemRequest {
  final String? foodBroughtType;
  final String? foodBrand;
  final int? quantity;
  final String? feedingInstructions;

  PetFoodBroughtItemRequest({
    this.foodBroughtType,
    this.foodBrand,
    this.quantity,
    this.feedingInstructions,
  });

  factory PetFoodBroughtItemRequest.fromJson(Map<String, dynamic> json) =>
      _$PetFoodBroughtItemRequestFromJson(json);

  Map<String, dynamic> toJson() => _$PetFoodBroughtItemRequestToJson(this);
}
