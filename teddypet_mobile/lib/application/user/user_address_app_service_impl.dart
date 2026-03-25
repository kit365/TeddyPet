import '../../data/models/request/user/user_address_request.dart';
import '../../data/models/response/user/user_address_response.dart';
import '../../data/repositories/user/user_address_repository.dart';
import 'user_address_app_service.dart';

class UserAddressAppServiceImpl implements UserAddressAppService {
  final UserAddressRepository _repository;

  UserAddressAppServiceImpl(this._repository);

  @override
  Future<List<UserAddressResponse>> getAll() {
    return _repository.getAll();
  }

  @override
  Future<UserAddressResponse?> getDetail(int id) {
    return _repository.getDetail(id);
  }

  @override
  Future<void> create(UserAddressRequest request) {
    return _repository.create(request);
  }

  @override
  Future<void> update(int id, UserAddressRequest request) {
    return _repository.update(id, request);
  }

  @override
  Future<void> delete(int id) {
    return _repository.delete(id);
  }

  @override
  Future<void> setDefault(int id) {
    return _repository.setDefault(id);
  }
}
