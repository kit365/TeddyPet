import 'package:flutter/material.dart';
import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';
import '../../controllers/product/product_controller.dart';

class ProductListProvider extends ChangeNotifier {
  final ProductController _controller;

  ProductListProvider(this._controller);

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<ProductEntity> _products = [];
  List<ProductEntity> get products => _products;

  String? _error;
  String? get error => _error;

  int? _selectedCategoryId;
  int? _selectedBrandId;
  List<String> _selectedPetTypes = [];
  String? _sortKey;
  String? _sortDirection;

  int? get selectedCategoryId => _selectedCategoryId;
  int? get selectedBrandId => _selectedBrandId;
  List<String> get selectedPetTypes => _selectedPetTypes;
  String? get sortKey => _sortKey;
  String? get sortDirection => _sortDirection;

  Future<void> fetchByCategoryId(int? categoryId) async {
    _selectedCategoryId = categoryId;
    await _fetchProducts();
  }

  Future<void> updateFilters({
    int? brandId,
    List<String>? petTypes,
    String? sortKey,
    String? sortDirection,
  }) async {
    _selectedBrandId = brandId;
    _selectedPetTypes = petTypes ?? [];
    _sortKey = sortKey;
    _sortDirection = sortDirection;
    await _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _products = await _controller.getProductsByCategory(
        _selectedCategoryId,
        brandId: _selectedBrandId,
        petTypes: _selectedPetTypes.isNotEmpty ? _selectedPetTypes : null,
        sortKey: _sortKey,
        sortDirection: _sortDirection,
      );
    } catch (e) {
      _error = e.toString();
      debugPrint("Error fetching products: \$e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void resetFilters() {
    _selectedBrandId = null;
    _selectedPetTypes = [];
    _sortKey = null;
    _sortDirection = null;
  }

  void clearProducts() {
    _products = [];
    _selectedCategoryId = null;
    resetFilters();
    notifyListeners();
  }
}
