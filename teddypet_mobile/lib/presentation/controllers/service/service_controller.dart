import '../../../application/service/service_app_service.dart';
import '../../../data/models/response/service/service_response.dart';
import '../../../data/models/response/service/time_slot_response.dart';
import '../../../data/models/response/service/room_response.dart';

class ServiceController {
  final ServiceAppService _appService;

  ServiceController(this._appService);

  Future<List<ServiceCategoryResponse>> getCategories() async {
    return await _appService.getCategories();
  }

  Future<List<ServiceResponse>> getServicesByCategoryId(int categoryId) async {
    return await _appService.getServicesByCategoryId(categoryId);
  }

  Future<List<TimeSlotResponse>> getAvailableSlots(String date) async {
    return await _appService.getAvailableSlots(date);
  }

  Future<List<RoomResponse>> getAvailableRooms({
    required String checkIn,
    required String checkOut,
    required String petType,
    required double weight,
  }) async {
    return await _appService.getAvailableRooms(
      checkIn: checkIn,
      checkOut: checkOut,
      petType: petType,
      weight: weight,
    );
  }

  Future<List<TimeSlotResponse>> getTimeSlotsByServiceId(int serviceId) async {
    return await _appService.getTimeSlotsByServiceId(serviceId);
  }

  Future<List<RoomLayoutConfigResponse>> getRoomLayoutConfigsByServiceId(int serviceId, {String? status}) async {
    return await _appService.getRoomLayoutConfigsByServiceId(serviceId, status: status);
  }

  Future<List<RoomTypeResponse>> getRoomTypes(int serviceId) async {
    return await _appService.getRoomTypes(serviceId);
  }
}
