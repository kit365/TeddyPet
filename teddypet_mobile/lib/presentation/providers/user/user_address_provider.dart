import 'package:flutter/material.dart';
import '../../../application/user/user_address_app_service_impl.dart';
import '../../../data/models/request/user/user_address_request.dart';
import '../../../data/models/response/user/user_address_response.dart';
import '../../../data/repositories/user/user_address_repository_impl.dart';
import '../../controllers/user/user_address_controller.dart';

class UserAddressProvider extends ChangeNotifier {
  late final UserAddressController _controller;

  UserAddressProvider() {
    final repository = UserAddressRepositoryImpl();
    final service = UserAddressAppServiceImpl(repository);
    _controller = UserAddressController(service);
  }

  List<UserAddressResponse> _addresses = [];
  bool _isLoading = false;
  String? _error;

  List<UserAddressResponse> get addresses => _addresses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> getAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _addresses = await _controller.getAll();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> create(UserAddressRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _controller.create(request);
      await getAll(); // Refresh list
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> update(int id, UserAddressRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _controller.update(id, request);
      await getAll();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> delete(int id) async {
    try {
      await _controller.delete(id);
      await getAll();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> setDefault(int id) async {
    try {
      await _controller.setDefault(id);
      await getAll();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
