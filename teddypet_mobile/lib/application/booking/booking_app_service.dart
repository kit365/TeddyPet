import '../../data/models/request/booking/create_booking_request.dart';
import '../../data/models/response/booking/booking_response.dart';

abstract class BookingAppService {
  Future<CreateBookingResponse> createBooking(CreateBookingRequest request);
  Future<List<ClientBookingDetailResponse>> getMyBookings();
  Future<ClientBookingDetailResponse> getBookingDetail(String code);
  Future<bool> cancelBooking(String code, String reason);
  Future<bool> upsertServiceReview(String bookingCode, int bookingPetServiceId, int rating, String? review, List<String>? photos);
}
