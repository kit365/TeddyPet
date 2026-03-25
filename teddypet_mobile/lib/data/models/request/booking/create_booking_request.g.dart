// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_booking_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CreateBookingRequest _$CreateBookingRequestFromJson(
  Map<String, dynamic> json,
) => CreateBookingRequest(
  customerName: json['customerName'] as String,
  customerEmail: json['customerEmail'] as String,
  customerPhone: json['customerPhone'] as String,
  customerAddress: json['customerAddress'] as String?,
  note: json['note'] as String?,
  source: json['source'] as String?,
  bookingType: json['bookingType'] as String,
  pets: (json['pets'] as List<dynamic>)
      .map((e) => CreateBookingPetRequest.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$CreateBookingRequestToJson(
  CreateBookingRequest instance,
) => <String, dynamic>{
  'customerName': instance.customerName,
  'customerEmail': instance.customerEmail,
  'customerPhone': instance.customerPhone,
  'customerAddress': instance.customerAddress,
  'note': instance.note,
  'source': instance.source,
  'bookingType': instance.bookingType,
  'pets': instance.pets,
};

CreateBookingPetRequest _$CreateBookingPetRequestFromJson(
  Map<String, dynamic> json,
) => CreateBookingPetRequest(
  petName: json['petName'] as String,
  petType: json['petType'] as String,
  weightAtBooking: (json['weightAtBooking'] as num?)?.toDouble(),
  emergencyContactName: json['emergencyContactName'] as String?,
  emergencyContactPhone: json['emergencyContactPhone'] as String?,
  petConditionNotes: json['petConditionNotes'] as String?,
  services: (json['services'] as List<dynamic>)
      .map(
        (e) =>
            CreateBookingPetServiceRequest.fromJson(e as Map<String, dynamic>),
      )
      .toList(),
  foodItems: (json['foodItems'] as List<dynamic>?)
      ?.map(
        (e) => PetFoodBroughtItemRequest.fromJson(e as Map<String, dynamic>),
      )
      .toList(),
);

Map<String, dynamic> _$CreateBookingPetRequestToJson(
  CreateBookingPetRequest instance,
) => <String, dynamic>{
  'petName': instance.petName,
  'petType': instance.petType,
  'weightAtBooking': instance.weightAtBooking,
  'emergencyContactName': instance.emergencyContactName,
  'emergencyContactPhone': instance.emergencyContactPhone,
  'petConditionNotes': instance.petConditionNotes,
  'services': instance.services,
  'foodItems': instance.foodItems,
};

CreateBookingPetServiceRequest _$CreateBookingPetServiceRequestFromJson(
  Map<String, dynamic> json,
) => CreateBookingPetServiceRequest(
  serviceId: (json['serviceId'] as num).toInt(),
  requiresRoom: json['requiresRoom'] as bool,
  checkInDate: json['checkInDate'] as String?,
  checkOutDate: json['checkOutDate'] as String?,
  roomId: (json['roomId'] as num?)?.toInt(),
  sessionDate: json['sessionDate'] as String?,
  sessionSlotLabel: json['sessionSlotLabel'] as String?,
  timeSlotId: (json['timeSlotId'] as num?)?.toInt(),
  addonServiceIds: (json['addonServiceIds'] as List<dynamic>?)
      ?.map((e) => (e as num).toInt())
      .toList(),
);

Map<String, dynamic> _$CreateBookingPetServiceRequestToJson(
  CreateBookingPetServiceRequest instance,
) => <String, dynamic>{
  'serviceId': instance.serviceId,
  'requiresRoom': instance.requiresRoom,
  'checkInDate': instance.checkInDate,
  'checkOutDate': instance.checkOutDate,
  'roomId': instance.roomId,
  'sessionDate': instance.sessionDate,
  'sessionSlotLabel': instance.sessionSlotLabel,
  'timeSlotId': instance.timeSlotId,
  'addonServiceIds': instance.addonServiceIds,
};

PetFoodBroughtItemRequest _$PetFoodBroughtItemRequestFromJson(
  Map<String, dynamic> json,
) => PetFoodBroughtItemRequest(
  foodBroughtType: json['foodBroughtType'] as String?,
  foodBrand: json['foodBrand'] as String?,
  quantity: (json['quantity'] as num?)?.toInt(),
  feedingInstructions: json['feedingInstructions'] as String?,
);

Map<String, dynamic> _$PetFoodBroughtItemRequestToJson(
  PetFoodBroughtItemRequest instance,
) => <String, dynamic>{
  'foodBroughtType': instance.foodBroughtType,
  'foodBrand': instance.foodBrand,
  'quantity': instance.quantity,
  'feedingInstructions': instance.feedingInstructions,
};
