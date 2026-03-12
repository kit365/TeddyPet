import 'package:flutter/material.dart';
import '../../../application/category/category_app_service.dart';
import '../../../data/models/response/category/category_response.dart';

class CategoryProvider extends ChangeNotifier {
  final CategoryAppService _categoryAppService;

  CategoryProvider(this._categoryAppService);

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<CategoryResponse> _categories = [];
  List<CategoryResponse> get categories => _categories;

  int _selectedIndex = 0;
  int get selectedIndex => _selectedIndex;

  // Lấy các mục detail con của danh mục đang được chọn
  List<CategoryResponse> get selectedCategoryItems {
    if (_categories.isEmpty || _selectedIndex < 0 || _selectedIndex >= _categories.length) {
      return [];
    }
    return _categories[_selectedIndex].items ?? [];
  }

  Future<void> fetchCategories() async {
    _isLoading = true;
    notifyListeners();

    try {
      _categories = await _categoryAppService.getCategories();
      _selectedIndex = 0;
    } catch (e) {
      debugPrint("Error fetching categories: \$e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectCategory(int index) {
    if (index != _selectedIndex) {
      _selectedIndex = index;
      notifyListeners();
    }
  }
}
