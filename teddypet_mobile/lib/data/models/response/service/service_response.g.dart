// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'service_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ServiceCategoryResponse _$ServiceCategoryResponseFromJson(
  Map<String, dynamic> json,
) => ServiceCategoryResponse(
  categoryId: (json['categoryId'] as num).toInt(),
  categoryName: json['categoryName'] as String,
  slug: json['slug'] as String,
  pricingModel: json['pricingModel'] as String?,
  description: json['description'] as String?,
  serviceType: json['serviceType'] as String?,
  colorCode: json['colorCode'] as String?,
  isActive: json['isActive'] as bool,
);

Map<String, dynamic> _$ServiceCategoryResponseToJson(
  ServiceCategoryResponse instance,
) => <String, dynamic>{
  'categoryId': instance.categoryId,
  'categoryName': instance.categoryName,
  'slug': instance.slug,
  'pricingModel': instance.pricingModel,
  'description': instance.description,
  'serviceType': instance.serviceType,
  'colorCode': instance.colorCode,
  'isActive': instance.isActive,
};

ServiceResponse _$ServiceResponseFromJson(Map<String, dynamic> json) =>
    ServiceResponse(
      serviceId: (json['serviceId'] as num).toInt(),
      serviceCategoryId: (json['serviceCategoryId'] as num).toInt(),
      serviceName: json['serviceName'] as String,
      code: json['code'] as String,
      duration: (json['duration'] as num).toInt(),
      advanceBookingHours: (json['advanceBookingHours'] as num?)?.toInt(),
      basePrice: (json['basePrice'] as num?)?.toDouble(),
      priceUnit: json['priceUnit'] as String?,
      suitablePetTypes: (json['suitablePetTypes'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      isActive: json['isActive'] as bool,
      isRequiredRoom: json['isRequiredRoom'] as bool?,
      isAddon: json['isAddon'] as bool?,
      isAdditionalCharge: json['isAdditionalCharge'] as bool?,
    );

Map<String, dynamic> _$ServiceResponseToJson(ServiceResponse instance) =>
    <String, dynamic>{
      'serviceId': instance.serviceId,
      'serviceCategoryId': instance.serviceCategoryId,
      'serviceName': instance.serviceName,
      'code': instance.code,
      'duration': instance.duration,
      'advanceBookingHours': instance.advanceBookingHours,
      'basePrice': instance.basePrice,
      'priceUnit': instance.priceUnit,
      'suitablePetTypes': instance.suitablePetTypes,
      'isActive': instance.isActive,
      'isRequiredRoom': instance.isRequiredRoom,
      'isAddon': instance.isAddon,
      'isAdditionalCharge': instance.isAdditionalCharge,
    };
