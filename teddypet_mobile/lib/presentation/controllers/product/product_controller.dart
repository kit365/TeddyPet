import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';
import '../../../data/models/response/product/product_detail_response.dart';
import '../../../data/models/response/feedback/feedback_response.dart';
import '../../../data/models/entities/feedback/feedback_entity.dart';
import '../../../../application/product/product_app_service.dart';

class ProductController {
  final ProductAppService _productAppService;

  ProductController(this._productAppService);

  Future<List<ProductEntity>> getProductsByCategory(
    int? categoryId, {
    int? brandId,
    List<String>? petTypes,
    String? sortKey,
    String? sortDirection,
  }) {
    return _productAppService.getProductsByCategory(
      categoryId,
      brandId: brandId,
      petTypes: petTypes,
      sortKey: sortKey,
      sortDirection: sortDirection,
    );
  }

  Future<ProductDetailResponse?> getProductDetail(String slug) {
    return _productAppService.getProductDetail(slug);
  }

  Future<ProductDetailResponse?> getProductDetailById(int id) {
    return _productAppService.getProductDetailById(id);
  }

  Future<List<ProductEntity>> getRelatedProducts(int productId, {int limit = 10}) {
    return _productAppService.getRelatedProducts(productId, limit: limit);
  }

  Future<List<FeedbackEntity>> getProductFeedbacks(int productId) {
    return _productAppService.getProductFeedbacks(productId);
  }
}
