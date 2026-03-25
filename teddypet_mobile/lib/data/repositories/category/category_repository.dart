import '../../models/response/category/category_response.dart';

abstract class CategoryRepository {
  Future<List<CategoryResponse>> getCategories();
}
