import '../../models/response/category/category_response.dart';
import '../../../../core/network/api_client.dart';
import 'category_repository.dart';

class CategoryRepositoryImpl implements CategoryRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<CategoryResponse>> getCategories() async {
    try {
      final response = await _apiClient.get<List<CategoryResponse>>(
        '/product-categories/nested', // Đúng với route bên BE
        fromJson: (json) {
          if (json is List) {
            return json.map((e) => CategoryResponse.fromJson(e)).toList();
          }
          return [];
        },
      );

      if (response.success && response.data != null) {
        return response.data!;
      }
      return [];
    } catch (e) {
      print("Lỗi khi lấy danh mục từ BE: \$e");
      return [];
    }
  }
}

