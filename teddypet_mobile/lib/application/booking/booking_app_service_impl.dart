import '../../data/models/request/booking/create_booking_request.dart';
import '../../data/models/response/booking/booking_response.dart';
import '../../data/repositories/booking/booking_repository.dart';
import './booking_app_service.dart';

class BookingAppServiceImpl implements BookingAppService {
  final BookingRepository _repository;

  BookingAppServiceImpl(this._repository);

  @override
  Future<CreateBookingResponse> createBooking(CreateBookingRequest request) async {
    return await _repository.createBooking(request);
  }

  @override
  Future<List<ClientBookingDetailResponse>> getMyBookings() async {
    return await _repository.getMyBookings();
  }

  @override
  Future<ClientBookingDetailResponse> getBookingDetail(String code) async {
    return await _repository.getBookingDetail(code);
  }

  @override
  Future<bool> cancelBooking(String code, String reason) async {
    return await _repository.cancelBooking(code, reason);
  }
}
