import '../../../application/category/category_app_service.dart';
import '../../../data/models/response/category/category_response.dart';

class CategoryController {
  final CategoryAppService _appService;

  CategoryController(this._appService);

  Future<List<CategoryResponse>> getCategories() {
    return _appService.getCategories();
  }
}
