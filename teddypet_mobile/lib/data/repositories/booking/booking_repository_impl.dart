import '../../../core/network/api_client.dart';
import '../../models/response/booking/booking_response.dart';
import '../../models/request/booking/create_booking_request.dart';
import 'booking_repository.dart';

class BookingRepositoryImpl implements BookingRepository {
  final ApiClient _apiClient;

  BookingRepositoryImpl(this._apiClient);

  @override
  Future<CreateBookingResponse> createBooking(CreateBookingRequest request) async {
    final response = await _apiClient.post('bookings', data: request.toJson());
    return CreateBookingResponse.fromJson(response.data);
  }

  @override
  Future<List<ClientBookingDetailResponse>> getMyBookings() async {
    final response = await _apiClient.get('bookings/my'); 
    return (response.data as List)
        .map((e) => ClientBookingDetailResponse.fromJson(e))
        .toList();
  }

  @override
  Future<ClientBookingDetailResponse> getBookingDetail(String bookingCode) async {
    final response = await _apiClient.get('bookings/code/$bookingCode');
    return ClientBookingDetailResponse.fromJson(response.data);
  }

  @override
  Future<bool> cancelBooking(String bookingCode, String reason) async {
    final response = await _apiClient.post(
      'bookings/code/$bookingCode/cancel',
      data: {'reason': reason},
    );
    return response.success;
  }
}
