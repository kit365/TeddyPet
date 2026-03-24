import '../../data/models/response/service/service_response.dart';
import '../../data/models/response/service/time_slot_response.dart';
import '../../data/models/response/service/room_response.dart';

abstract class ServiceAppService {
  Future<List<ServiceCategoryResponse>> getCategories();
  Future<List<ServiceResponse>> getServicesByCategoryId(int categoryId);
  Future<List<TimeSlotResponse>> getAvailableSlots(String date);
  Future<List<RoomResponse>> getAvailableRooms({
    required String checkIn,
    required String checkOut,
    required String petType,
    required double weight,
  });
  Future<List<TimeSlotResponse>> getTimeSlotsByServiceId(int serviceId);
  Future<List<RoomLayoutConfigResponse>> getRoomLayoutConfigsByServiceId(int serviceId, {String? status});
  Future<List<RoomTypeResponse>> getRoomTypes(int serviceId);
}
