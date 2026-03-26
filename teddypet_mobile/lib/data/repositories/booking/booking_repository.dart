import '../../models/response/booking/booking_response.dart';
import '../../models/request/booking/create_booking_request.dart';

abstract class BookingRepository {
  Future<CreateBookingResponse> createBooking(CreateBookingRequest request);
  Future<List<ClientBookingDetailResponse>> getMyBookings();
  Future<ClientBookingDetailResponse> getBookingDetail(String bookingCode);
  Future<bool> cancelBooking(String bookingCode, String reason);
  Future<bool> upsertServiceReview(String bookingCode, int bookingPetServiceId, int rating, String? review, List<String>? photos);
}
