import '../../models/response/product/brand_response.dart';
import '../../../../core/network/api_client.dart';
import 'brand_repository.dart';

class BrandRepositoryImpl implements BrandRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<BrandResponse>> getAllBrands() async {
    try {
      final response = await _apiClient.get<List<BrandResponse>>(
        'product-brands',
        fromJson: (json) {
          if (json is List) {
            return json.map((e) => BrandResponse.fromJson(e)).toList();
          }
          return [];
        },
      );

      if (response.success && response.data != null) {
        return response.data!;
      }
      return [];
    } catch (e) {
      print("Lỗi khi lấy danh sách thương hiệu: \$e");
      return [];
    }
  }
}

abstract class BrandRepository {
  Future<List<BrandResponse>> getAllBrands();
}
