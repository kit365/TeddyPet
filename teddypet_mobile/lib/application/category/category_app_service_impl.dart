import '../../data/models/response/category/category_response.dart';
import '../../data/repositories/category/category_repository.dart';
import 'category_app_service.dart';

class CategoryAppServiceImpl implements CategoryAppService {
  final CategoryRepository _repository;

  CategoryAppServiceImpl(this._repository);

  @override
  Future<List<CategoryResponse>> getCategories() async {
    return await _repository.getCategories();
  }
}
