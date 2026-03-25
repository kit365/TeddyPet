// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'booking_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ClientBookingDetailResponse _$ClientBookingDetailResponseFromJson(
  Map<String, dynamic> json,
) => ClientBookingDetailResponse(
  id: (json['id'] as num).toInt(),
  bookingCode: json['bookingCode'] as String,
  customerName: json['customerName'] as String,
  customerEmail: json['customerEmail'] as String,
  customerPhone: json['customerPhone'] as String,
  customerAddress: json['customerAddress'] as String?,
  bookingType: json['bookingType'] as String,
  totalAmount: (json['totalAmount'] as num).toDouble(),
  paidAmount: (json['paidAmount'] as num).toDouble(),
  remainingAmount: (json['remainingAmount'] as num).toDouble(),
  depositPaid: json['depositPaid'] as bool?,
  paymentStatus: json['paymentStatus'] as String,
  paymentMethod: json['paymentMethod'] as String?,
  status: json['status'] as String,
  internalNotes: json['internalNotes'] as String?,
  cancelRequested: json['cancelRequested'] as bool?,
  cancelledReason: json['cancelledReason'] as String?,
  depositId: (json['depositId'] as num?)?.toInt(),
  depositExpiresAt: json['depositExpiresAt'] == null
      ? null
      : DateTime.parse(json['depositExpiresAt'] as String),
  bookingCheckInDate: json['bookingCheckInDate'] == null
      ? null
      : DateTime.parse(json['bookingCheckInDate'] as String),
  bookingCheckOutDate: json['bookingCheckOutDate'] == null
      ? null
      : DateTime.parse(json['bookingCheckOutDate'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
  pets: (json['pets'] as List<dynamic>?)
      ?.map(
        (e) =>
            ClientBookingPetDetailResponse.fromJson(e as Map<String, dynamic>),
      )
      .toList(),
);

Map<String, dynamic> _$ClientBookingDetailResponseToJson(
  ClientBookingDetailResponse instance,
) => <String, dynamic>{
  'id': instance.id,
  'bookingCode': instance.bookingCode,
  'customerName': instance.customerName,
  'customerEmail': instance.customerEmail,
  'customerPhone': instance.customerPhone,
  'customerAddress': instance.customerAddress,
  'bookingType': instance.bookingType,
  'totalAmount': instance.totalAmount,
  'paidAmount': instance.paidAmount,
  'remainingAmount': instance.remainingAmount,
  'depositPaid': instance.depositPaid,
  'paymentStatus': instance.paymentStatus,
  'paymentMethod': instance.paymentMethod,
  'status': instance.status,
  'internalNotes': instance.internalNotes,
  'cancelRequested': instance.cancelRequested,
  'cancelledReason': instance.cancelledReason,
  'depositId': instance.depositId,
  'depositExpiresAt': instance.depositExpiresAt?.toIso8601String(),
  'bookingCheckInDate': instance.bookingCheckInDate?.toIso8601String(),
  'bookingCheckOutDate': instance.bookingCheckOutDate?.toIso8601String(),
  'createdAt': instance.createdAt.toIso8601String(),
  'pets': instance.pets,
};

ClientBookingPetDetailResponse _$ClientBookingPetDetailResponseFromJson(
  Map<String, dynamic> json,
) => ClientBookingPetDetailResponse(
  id: (json['id'] as num).toInt(),
  petName: json['petName'] as String,
  petType: json['petType'] as String,
  emergencyContactName: json['emergencyContactName'] as String?,
  emergencyContactPhone: json['emergencyContactPhone'] as String?,
  weightAtBooking: (json['weightAtBooking'] as num?)?.toDouble(),
  petConditionNotes: json['petConditionNotes'] as String?,
  arrivalCondition: json['arrivalCondition'] as String?,
  departureCondition: json['departureCondition'] as String?,
  arrivalPhotos: json['arrivalPhotos'] as String?,
  departurePhotos: json['departurePhotos'] as String?,
  belongingPhotos: json['belongingPhotos'] as String?,
  foodBrought: json['foodBrought'] as String?,
  services: (json['services'] as List<dynamic>?)
      ?.map(
        (e) => ClientBookingPetServiceDetailResponse.fromJson(
          e as Map<String, dynamic>,
        ),
      )
      .toList(),
  foodItems: (json['foodItems'] as List<dynamic>?)
      ?.map(
        (e) => ClientPetFoodBroughtDetailResponse.fromJson(
          e as Map<String, dynamic>,
        ),
      )
      .toList(),
);

Map<String, dynamic> _$ClientBookingPetDetailResponseToJson(
  ClientBookingPetDetailResponse instance,
) => <String, dynamic>{
  'id': instance.id,
  'petName': instance.petName,
  'petType': instance.petType,
  'emergencyContactName': instance.emergencyContactName,
  'emergencyContactPhone': instance.emergencyContactPhone,
  'weightAtBooking': instance.weightAtBooking,
  'petConditionNotes': instance.petConditionNotes,
  'arrivalCondition': instance.arrivalCondition,
  'departureCondition': instance.departureCondition,
  'arrivalPhotos': instance.arrivalPhotos,
  'departurePhotos': instance.departurePhotos,
  'belongingPhotos': instance.belongingPhotos,
  'foodBrought': instance.foodBrought,
  'services': instance.services,
  'foodItems': instance.foodItems,
};

ClientBookingPetServiceDetailResponse
_$ClientBookingPetServiceDetailResponseFromJson(Map<String, dynamic> json) =>
    ClientBookingPetServiceDetailResponse(
      id: (json['id'] as num).toInt(),
      assignedStaffIds: (json['assignedStaffIds'] as List<dynamic>?)
          ?.map((e) => (e as num).toInt())
          .toList(),
      assignedStaffNames: json['assignedStaffNames'] as String?,
      serviceName: json['serviceName'] as String,
      timeSlotName: json['timeSlotName'] as String?,
      estimatedCheckInDate: json['estimatedCheckInDate'] == null
          ? null
          : DateTime.parse(json['estimatedCheckInDate'] as String),
      estimatedCheckOutDate: json['estimatedCheckOutDate'] == null
          ? null
          : DateTime.parse(json['estimatedCheckOutDate'] as String),
      actualCheckInDate: json['actualCheckInDate'] == null
          ? null
          : DateTime.parse(json['actualCheckInDate'] as String),
      actualCheckOutDate: json['actualCheckOutDate'] == null
          ? null
          : DateTime.parse(json['actualCheckOutDate'] as String),
      numberOfNights: (json['numberOfNights'] as num?)?.toInt(),
      scheduledStartTime: json['scheduledStartTime'] == null
          ? null
          : DateTime.parse(json['scheduledStartTime'] as String),
      scheduledEndTime: json['scheduledEndTime'] == null
          ? null
          : DateTime.parse(json['scheduledEndTime'] as String),
      actualStartTime: json['actualStartTime'] == null
          ? null
          : DateTime.parse(json['actualStartTime'] as String),
      actualEndTime: json['actualEndTime'] == null
          ? null
          : DateTime.parse(json['actualEndTime'] as String),
      basePrice: (json['basePrice'] as num).toDouble(),
      subtotal: (json['subtotal'] as num).toDouble(),
      status: json['status'] as String,
      staffNotes: json['staffNotes'] as String?,
      beforePhotos: json['beforePhotos'] as String?,
      duringPhotos: json['duringPhotos'] as String?,
      afterPhotos: json['afterPhotos'] as String?,
      customerRating: (json['customerRating'] as num?)?.toInt(),
      customerReview: json['customerReview'] as String?,
      roomId: (json['roomId'] as num?)?.toInt(),
      roomName: json['roomName'] as String?,
      displayTypeName: json['displayTypeName'] as String?,
      roomNumber: json['roomNumber'] as String?,
      items: (json['items'] as List<dynamic>?)
          ?.map(
            (e) => ClientBookingPetServiceItemDetailResponse.fromJson(
              e as Map<String, dynamic>,
            ),
          )
          .toList(),
    );

Map<String, dynamic> _$ClientBookingPetServiceDetailResponseToJson(
  ClientBookingPetServiceDetailResponse instance,
) => <String, dynamic>{
  'id': instance.id,
  'assignedStaffIds': instance.assignedStaffIds,
  'assignedStaffNames': instance.assignedStaffNames,
  'serviceName': instance.serviceName,
  'timeSlotName': instance.timeSlotName,
  'estimatedCheckInDate': instance.estimatedCheckInDate?.toIso8601String(),
  'estimatedCheckOutDate': instance.estimatedCheckOutDate?.toIso8601String(),
  'actualCheckInDate': instance.actualCheckInDate?.toIso8601String(),
  'actualCheckOutDate': instance.actualCheckOutDate?.toIso8601String(),
  'numberOfNights': instance.numberOfNights,
  'scheduledStartTime': instance.scheduledStartTime?.toIso8601String(),
  'scheduledEndTime': instance.scheduledEndTime?.toIso8601String(),
  'actualStartTime': instance.actualStartTime?.toIso8601String(),
  'actualEndTime': instance.actualEndTime?.toIso8601String(),
  'basePrice': instance.basePrice,
  'subtotal': instance.subtotal,
  'status': instance.status,
  'staffNotes': instance.staffNotes,
  'beforePhotos': instance.beforePhotos,
  'duringPhotos': instance.duringPhotos,
  'afterPhotos': instance.afterPhotos,
  'customerRating': instance.customerRating,
  'customerReview': instance.customerReview,
  'roomId': instance.roomId,
  'roomName': instance.roomName,
  'displayTypeName': instance.displayTypeName,
  'roomNumber': instance.roomNumber,
  'items': instance.items,
};

ClientBookingPetServiceItemDetailResponse
_$ClientBookingPetServiceItemDetailResponseFromJson(
  Map<String, dynamic> json,
) => ClientBookingPetServiceItemDetailResponse(
  id: (json['id'] as num).toInt(),
  itemName: json['itemName'] as String?,
  quantity: (json['quantity'] as num?)?.toInt(),
  price: (json['price'] as num?)?.toDouble(),
  subtotal: (json['subtotal'] as num?)?.toDouble(),
);

Map<String, dynamic> _$ClientBookingPetServiceItemDetailResponseToJson(
  ClientBookingPetServiceItemDetailResponse instance,
) => <String, dynamic>{
  'id': instance.id,
  'itemName': instance.itemName,
  'quantity': instance.quantity,
  'price': instance.price,
  'subtotal': instance.subtotal,
};

ClientPetFoodBroughtDetailResponse _$ClientPetFoodBroughtDetailResponseFromJson(
  Map<String, dynamic> json,
) => ClientPetFoodBroughtDetailResponse(
  id: (json['id'] as num).toInt(),
  foodBroughtType: json['foodBroughtType'] as String?,
  foodBrand: json['foodBrand'] as String?,
  quantity: (json['quantity'] as num?)?.toInt(),
  feedingInstructions: json['feedingInstructions'] as String?,
);

Map<String, dynamic> _$ClientPetFoodBroughtDetailResponseToJson(
  ClientPetFoodBroughtDetailResponse instance,
) => <String, dynamic>{
  'id': instance.id,
  'foodBroughtType': instance.foodBroughtType,
  'foodBrand': instance.foodBrand,
  'quantity': instance.quantity,
  'feedingInstructions': instance.feedingInstructions,
};

CreateBookingResponse _$CreateBookingResponseFromJson(
  Map<String, dynamic> json,
) => CreateBookingResponse(bookingCode: json['bookingCode'] as String);

Map<String, dynamic> _$CreateBookingResponseToJson(
  CreateBookingResponse instance,
) => <String, dynamic>{'bookingCode': instance.bookingCode};
