import 'package:flutter/material.dart';
import '../../../data/models/request/booking/create_booking_request.dart';
import '../../../data/models/response/booking/booking_response.dart';
import '../../controllers/booking/booking_controller.dart';

class BookingProvider extends ChangeNotifier {
  final BookingController _controller;

  BookingProvider(this._controller);

  List<ClientBookingDetailResponse> _myBookings = [];
  List<ClientBookingDetailResponse> get myBookings => _myBookings;

  ClientBookingDetailResponse? _currentBookingDetail;
  ClientBookingDetailResponse? get currentBookingDetail => _currentBookingDetail;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  // Wizard state
  CreateBookingRequest? _draftBooking;
  CreateBookingRequest? get draftBooking => _draftBooking;

  void startNewBooking() {
    _draftBooking = CreateBookingRequest(
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      bookingType: 'ONLINE',
      pets: [],
    );
    notifyListeners();
  }

  void updateDraftBooking(CreateBookingRequest updated) {
    _draftBooking = updated;
    notifyListeners();
  }

  Future<void> fetchMyBookings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _myBookings = await _controller.getMyBookings();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<ClientBookingDetailResponse> fetchBookingDetail(String code) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentBookingDetail = await _controller.getBookingDetail(code);
      return _currentBookingDetail!;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<CreateBookingResponse> createBooking(CreateBookingRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _controller.createBooking(request);
      _draftBooking = null;
      return response;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> cancelBooking(String code, String reason) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _controller.cancelBooking(code, reason);
      // Refresh list or detail if needed
      if (_currentBookingDetail?.bookingCode == code) {
        await fetchBookingDetail(code);
      }
      await fetchMyBookings();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> upsertServiceReview(String bookingCode, int bookingPetServiceId, int rating, String? review, List<String>? photos) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _controller.upsertServiceReview(bookingCode, bookingPetServiceId, rating, review, photos);
      // Refresh detail to show the new review
      if (_currentBookingDetail?.bookingCode == bookingCode) {
        await fetchBookingDetail(bookingCode);
      }
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
