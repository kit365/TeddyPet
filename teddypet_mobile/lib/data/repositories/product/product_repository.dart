import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';
import '../../models/response/feedback/feedback_response.dart';
import '../../models/entities/feedback/feedback_entity.dart';
import '../../../data/models/response/product/product_detail_response.dart';

abstract class ProductRepository {
  Future<List<ProductEntity>> getProductsByCategory(
    int? categoryId, {
    int? brandId,
    List<String>? petTypes,
    String? sortKey,
    String? sortDirection,
  });

  Future<ProductDetailResponse?> getProductDetail(String slug);
  Future<ProductDetailResponse?> getProductDetailById(int id);

  Future<List<ProductEntity>> getRelatedProducts(int productId, {int limit = 10});

  Future<List<FeedbackEntity>> getProductFeedbacks(int productId);
}
