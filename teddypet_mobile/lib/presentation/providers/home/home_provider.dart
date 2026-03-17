import 'package:flutter/material.dart';
import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';
import '../../../data/models/response/category/category_response.dart';
import '../../controllers/product/product_controller.dart';
import '../../controllers/category/category_controller.dart';

class HomeProvider extends ChangeNotifier {
  final ProductController _productController;
  final CategoryController _categoryController;

  HomeProvider(this._productController, this._categoryController);

  List<CategoryResponse> _categories = [];
  List<CategoryResponse> get categories => _categories;

  List<ProductEntity> _newArrivals = [];
  List<ProductEntity> get newArrivals => _newArrivals;

  List<ProductEntity> _bestSellers = [];
  List<ProductEntity> get bestSellers => _bestSellers;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  Future<void> fetchHomeData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _categoryController.getCategories(),
        _productController.getProductsByCategory(null, sortKey: 'createdAt', sortDirection: 'desc'),
        _productController.getProductsByCategory(null, sortKey: 'soldCount', sortDirection: 'desc'),
      ]);

      _categories = results[0] as List<CategoryResponse>;
      _newArrivals = results[1] as List<ProductEntity>;
      _bestSellers = results[2] as List<ProductEntity>;
    } catch (e) {
      _error = "Lỗi khi tải dữ liệu trang chủ: $e";
      debugPrint(_error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
