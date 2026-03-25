import '../../data/models/response/service/service_response.dart';
import '../../data/models/response/service/time_slot_response.dart';
import '../../data/models/response/service/room_response.dart';
import '../../data/repositories/service/service_repository.dart';
import './service_app_service.dart';

class ServiceAppServiceImpl implements ServiceAppService {
  final ServiceRepository _repository;

  ServiceAppServiceImpl(this._repository);

  @override
  Future<List<ServiceCategoryResponse>> getCategories() async {
    return await _repository.getCategories();
  }

  @override
  Future<List<ServiceResponse>> getServicesByCategoryId(int categoryId) async {
    return await _repository.getServicesByCategoryId(categoryId);
  }

  @override
  Future<List<TimeSlotResponse>> getAvailableSlots(String date) async {
    return await _repository.getAvailableSlots(date);
  }

  @override
  Future<List<RoomResponse>> getAvailableRooms({
    required String checkIn,
    required String checkOut,
    required String petType,
    required double weight,
  }) async {
    return await _repository.getAvailableRooms(
      checkIn: checkIn,
      checkOut: checkOut,
      petType: petType,
      weight: weight,
    );
  }

  @override
  Future<List<TimeSlotResponse>> getTimeSlotsByServiceId(int serviceId) async {
    return await _repository.getTimeSlotsByServiceId(serviceId);
  }

  @override
  Future<List<RoomLayoutConfigResponse>> getRoomLayoutConfigsByServiceId(int serviceId, {String? status}) async {
    return await _repository.getRoomLayoutConfigsByServiceId(serviceId, status: status);
  }

  @override
  Future<List<RoomTypeResponse>> getRoomTypes(int serviceId) async {
    return await _repository.getRoomTypes(serviceId);
  }
}
