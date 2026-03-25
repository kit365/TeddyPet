import 'package:flutter/material.dart';
import '../../../data/models/response/service/service_response.dart';
import '../../../data/models/response/service/time_slot_response.dart';
import '../../../data/models/response/service/room_response.dart';
import '../../controllers/service/service_controller.dart';

class ServiceProvider extends ChangeNotifier {
  final ServiceController _controller;

  ServiceProvider(this._controller);

  List<ServiceCategoryResponse> _categories = [];
  List<ServiceCategoryResponse> get categories => _categories;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  List<ServiceResponse> _services = [];
  List<ServiceResponse> get services => _services;

  Future<void> fetchCategories() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _categories = await _controller.getCategories();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchServicesByCategoryId(int categoryId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _services = await _controller.getServicesByCategoryId(categoryId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<TimeSlotResponse>> getAvailableSlots(String date) async {
    try {
      return await _controller.getAvailableSlots(date);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<RoomResponse>> getAvailableRooms({
    required String checkIn,
    required String checkOut,
    required String petType,
    required double weight,
  }) async {
    try {
      return await _controller.getAvailableRooms(
        checkIn: checkIn,
        checkOut: checkOut,
        petType: petType,
        weight: weight,
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<List<TimeSlotResponse>> getTimeSlotsByServiceId(int serviceId) async {
    try {
      return await _controller.getTimeSlotsByServiceId(serviceId);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<RoomLayoutConfigResponse>> getRoomLayoutConfigsByServiceId(int serviceId, {String? status}) async {
    try {
      return await _controller.getRoomLayoutConfigsByServiceId(serviceId, status: status);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<RoomTypeResponse>> getRoomTypes(int serviceId) async {
    try {
      return await _controller.getRoomTypes(serviceId);
    } catch (e) {
      rethrow;
    }
  }
}
