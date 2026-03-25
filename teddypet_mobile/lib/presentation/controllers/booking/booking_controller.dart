import '../../../application/booking/booking_app_service.dart';
import '../../../data/models/request/booking/create_booking_request.dart';
import '../../../data/models/response/booking/booking_response.dart';

class BookingController {
  final BookingAppService _appService;

  BookingController(this._appService);

  Future<CreateBookingResponse> createBooking(CreateBookingRequest request) async {
    return await _appService.createBooking(request);
  }

  Future<List<ClientBookingDetailResponse>> getMyBookings() async {
    return await _appService.getMyBookings();
  }

  Future<ClientBookingDetailResponse> getBookingDetail(String code) async {
    return await _appService.getBookingDetail(code);
  }

  Future<bool> cancelBooking(String code, String reason) async {
    return await _appService.cancelBooking(code, reason);
  }

  Future<bool> upsertServiceReview(String bookingCode, int bookingPetServiceId, int rating, String? review, List<String>? photos) async {
    return await _appService.upsertServiceReview(bookingCode, bookingPetServiceId, rating, review, photos);
  }
}
