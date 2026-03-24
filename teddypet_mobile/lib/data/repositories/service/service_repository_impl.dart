import '../../../core/network/api_client.dart';
import '../../models/response/service/service_response.dart';
import '../../models/response/service/time_slot_response.dart';
import '../../models/response/service/room_response.dart';
import 'service_repository.dart';

class ServiceRepositoryImpl implements ServiceRepository {
  final ApiClient _apiClient;

  ServiceRepositoryImpl(this._apiClient);

  @override
  Future<List<ServiceCategoryResponse>> getCategories() async {
    final response = await _apiClient.get('service-categories');
    return (response.data as List)
        .map((e) => ServiceCategoryResponse.fromJson(e))
        .toList();
  }

  @override
  Future<List<ServiceResponse>> getServices() async {
    final response = await _apiClient.get('services');
    return (response.data as List)
        .map((e) => ServiceResponse.fromJson(e))
        .toList();
  }

  @override
  Future<List<ServiceResponse>> getServicesByCategoryId(int categoryId) async {
    final response = await _apiClient.get('services/category/$categoryId');
    return (response.data as List)
        .map((e) => ServiceResponse.fromJson(e))
        .toList();
  }

  @override
  Future<List<TimeSlotResponse>> getAvailableSlots(String date) async {
     final response = await _apiClient.get('time-slots/available', queryParameters: {'date': date});
     return (response.data as List)
         .map((e) => TimeSlotResponse.fromJson(e))
         .toList();
  }

  @override
  Future<List<RoomResponse>> getAvailableRooms({
    required String checkIn,
    required String checkOut,
    required String petType,
    required double weight,
  }) async {
    final response = await _apiClient.get('rooms/available', queryParameters: {
      'checkIn': checkIn,
      'checkOut': checkOut,
      'petType': petType,
      'weight': weight,
    });
    return (response.data as List)
        .map((e) => RoomResponse.fromJson(e))
        .toList();
  }

  @override
  Future<List<TimeSlotResponse>> getTimeSlotsByServiceId(int serviceId) async {
    final response = await _apiClient.get('time-slots/service/$serviceId');
    return (response.data as List)
        .map((e) => TimeSlotResponse.fromJson(e))
        .toList();
  }

  @override
  Future<List<RoomLayoutConfigResponse>> getRoomLayoutConfigsByServiceId(int serviceId, {String? status}) async {
    final response = await _apiClient.get('room-layout-configs', queryParameters: {
      'serviceId': serviceId,
      if (status != null) 'status': status,
    });
    return (response.data as List)
        .map((e) => RoomLayoutConfigResponse.fromJson(e))
        .toList();
  }

  @override
  Future<List<RoomResponse>> getRoomsByLayoutConfigId(int layoutConfigId) async {
    final response = await _apiClient.get('rooms', queryParameters: {
      'roomLayoutConfigId': layoutConfigId,
    });
    return (response.data as List)
        .map((e) => RoomResponse.fromJson(e))
        .toList();
  }

  @override
  Future<List<RoomTypeResponse>> getRoomTypes(int serviceId) async {
    final response = await _apiClient.get('room-types', queryParameters: {
      'serviceId': serviceId,
    });
    return (response.data as List)
        .map((e) => RoomTypeResponse.fromJson(e))
        .toList();
  }

  @override
  Future<List<int>> getBookedRoomIds(String checkIn, String checkOut) async {
    final response = await _apiClient.get('rooms/booked-ids', queryParameters: {
      'checkIn': checkIn,
      'checkOut': checkOut,
    });
    return (response.data as List).cast<int>();
  }
}
