import 'package:json_annotation/json_annotation.dart';

part 'service_response.g.dart';

@JsonSerializable()
class ServiceCategoryResponse {
  final int categoryId;
  final String categoryName;
  final String slug;
  final String? pricingModel; // "per_day" | "per_session"
  final String? description;
  final String? serviceType;
  final String? colorCode;
  final bool isActive;

  ServiceCategoryResponse({
    required this.categoryId,
    required this.categoryName,
    required this.slug,
    this.pricingModel,
    this.description,
    this.serviceType,
    this.colorCode,
    required this.isActive,
  });

  factory ServiceCategoryResponse.fromJson(Map<String, dynamic> json) =>
      _$ServiceCategoryResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ServiceCategoryResponseToJson(this);
}

@JsonSerializable()
class ServiceResponse {
  final int serviceId;
  final int serviceCategoryId;
  final String serviceName;
  final String code;
  final int duration;
  final int? advanceBookingHours;
  final double? basePrice;
  final String? priceUnit;
  final List<String>? suitablePetTypes;
  final bool isActive;
  final bool? isRequiredRoom;
  final bool? isAddon;
  final bool? isAdditionalCharge;

  ServiceResponse({
    required this.serviceId,
    required this.serviceCategoryId,
    required this.serviceName,
    required this.code,
    required this.duration,
    this.advanceBookingHours,
    this.basePrice,
    this.priceUnit,
    this.suitablePetTypes,
    required this.isActive,
    this.isRequiredRoom,
    this.isAddon,
    this.isAdditionalCharge,
  });

  factory ServiceResponse.fromJson(Map<String, dynamic> json) =>
      _$ServiceResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ServiceResponseToJson(this);
}
