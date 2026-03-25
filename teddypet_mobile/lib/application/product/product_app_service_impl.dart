import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';
import '../../data/models/response/product/product_detail_response.dart';
import '../../data/models/response/product/product_response.dart';
import '../../data/models/response/feedback/feedback_response.dart';
import '../../data/models/entities/feedback/feedback_entity.dart';
import '../../data/repositories/product/product_repository.dart';
import 'product_app_service.dart';

class ProductAppServiceImpl implements ProductAppService {
  final ProductRepository _productRepository;

  ProductAppServiceImpl(this._productRepository);

  @override
  Future<List<ProductEntity>> getProductsByCategory(
    int? categoryId, {
    int? brandId,
    List<String>? petTypes,
    String? sortKey,
    String? sortDirection,
  }) {
    return _productRepository.getProductsByCategory(
      categoryId,
      brandId: brandId,
      petTypes: petTypes,
      sortKey: sortKey,
      sortDirection: sortDirection,
    );
  }

  @override
  Future<ProductDetailResponse?> getProductDetail(String slug) {
    return _productRepository.getProductDetail(slug);
  }

  @override
  Future<ProductDetailResponse?> getProductDetailById(int id) {
    return _productRepository.getProductDetailById(id);
  }

  @override
  Future<List<ProductEntity>> getRelatedProducts(int productId, {int limit = 10}) {
    return _productRepository.getRelatedProducts(productId, limit: limit);
  }

  @override
  Future<List<FeedbackEntity>> getProductFeedbacks(int productId) {
    return _productRepository.getProductFeedbacks(productId);
  }
}
