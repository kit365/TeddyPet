import '../../data/models/response/category/category_response.dart';

abstract class CategoryAppService {
  Future<List<CategoryResponse>> getCategories();
}
