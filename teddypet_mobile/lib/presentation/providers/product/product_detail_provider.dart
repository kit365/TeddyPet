import 'package:flutter/material.dart';
import 'package:teddypet_mobile/data/models/entities/feedback/feedback_entity.dart';
import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';
import '../../../data/models/response/product/product_detail_response.dart';
import '../../controllers/product/product_controller.dart';

class ProductDetailProvider extends ChangeNotifier {
  final ProductController _productController;

  ProductDetailProvider(this._productController);

  ProductDetailResponse? _product;
  ProductDetailResponse? get product => _product;

  List<ProductEntity> _relatedProducts = [];
  List<ProductEntity> get relatedProducts => _relatedProducts;

  List<FeedbackEntity> _feedbacks = [];
  List<FeedbackEntity> get feedbacks => _feedbacks;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  Future<void> fetchProductDetail(String slug) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _productController.getProductDetail(slug);
      await _handleDetailResult(result);
    } catch (e) {
      _error = "Lỗi khi tải thông tin sản phẩm: $e";
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchProductDetailById(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _productController.getProductDetailById(id);
      await _handleDetailResult(result);
    } catch (e) {
      _error = "Lỗi khi tải thông tin sản phẩm: $e";
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _handleDetailResult(ProductDetailResponse? result) async {
    if (result != null) {
      _product = result;
      
      // Fetch related data in parallel
      final results = await Future.wait([
        _productController.getRelatedProducts(result.id),
        _productController.getProductFeedbacks(result.id),
      ]);
      
      _relatedProducts = results[0] as List<ProductEntity>;
      _feedbacks = results[1] as List<FeedbackEntity>;
    } else {
      _error = "Không tìm thấy thông tin sản phẩm";
    }
  }

  void clear() {
    _product = null;
    _error = null;
    _isLoading = false;
    notifyListeners();
  }
}
