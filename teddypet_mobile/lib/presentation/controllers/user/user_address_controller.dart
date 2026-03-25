import '../../../application/user/user_address_app_service.dart';
import '../../../data/models/request/user/user_address_request.dart';
import '../../../data/models/response/user/user_address_response.dart';

class UserAddressController {
  final UserAddressAppService _service;

  UserAddressController(this._service);

  Future<List<UserAddressResponse>> getAll() async {
    return await _service.getAll();
  }

  Future<UserAddressResponse?> getDetail(int id) async {
    return await _service.getDetail(id);
  }

  Future<void> create(UserAddressRequest request) async {
    await _service.create(request);
  }

  Future<void> update(int id, UserAddressRequest request) async {
    await _service.update(id, request);
  }

  Future<void> delete(int id) async {
    await _service.delete(id);
  }

  Future<void> setDefault(int id) async {
    await _service.setDefault(id);
  }
}
