import '../../models/request/user/user_address_request.dart';
import '../../models/response/user/user_address_response.dart';

abstract class UserAddressRepository {
  Future<List<UserAddressResponse>> getAll();
  Future<UserAddressResponse?> getDetail(int id);
  Future<void> create(UserAddressRequest request);
  Future<void> update(int id, UserAddressRequest request);
  Future<void> delete(int id);
  Future<void> setDefault(int id);
}
