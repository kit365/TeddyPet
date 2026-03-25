import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';
import '../../models/response/product/product_response.dart';
import '../../models/response/product/product_detail_response.dart';
import '../../models/response/feedback/feedback_response.dart';
import '../../models/entities/feedback/feedback_entity.dart';
import '../../../../core/network/api_client.dart';
import 'product_repository.dart';

class ProductRepositoryImpl implements ProductRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<ProductEntity>> getProductsByCategory(
    int? categoryId, {
    int? brandId,
    List<String>? petTypes,
    String? sortKey,
    String? sortDirection,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {
        'size': '100',
      };

      if (categoryId != null) queryParams['categoryIds'] = categoryId.toString();
      if (brandId != null) queryParams['brandId'] = brandId.toString();
      if (petTypes != null && petTypes.isNotEmpty) {
        queryParams['petTypes'] = petTypes.join(',');
      }
      if (sortKey != null) queryParams['sortKey'] = sortKey;
      if (sortDirection != null) queryParams['sortDirection'] = sortDirection;

      final response = await _apiClient.get<List<ProductResponse>>(
        'products',
        queryParameters: queryParams,
        fromJson: (json) {
          if (json is Map<String, dynamic> && json['content'] != null) {
            final content = json['content'] as List;
            return content.map((e) => ProductResponse.fromJson(e)).toList();
          }
          if (json is List) {
            return json.map((e) => ProductResponse.fromJson(e)).toList();
          }
          return [];
        },
      );

      if (response.success && response.data != null) {
        return response.data!.map((e) => ProductEntity.fromResponse(e)).toList();
      }
      return [];
    } catch (e) {
      print("Lỗi khi lấy sản phẩm theo danh mục: \$e");
      return [];
    }
  }

  @override
  Future<ProductDetailResponse?> getProductDetail(String slug) async {
    try {
      final response = await _apiClient.get<ProductDetailResponse>(
        'home/products/$slug',
        fromJson: (json) => ProductDetailResponse.fromJson(json),
      );

      if (response.success && response.data != null) {
        return response.data!;
      }
      return null;
    } catch (e, stackTrace) {
      print("Lỗi khi lấy chi tiết sản phẩm: $e");
      print(stackTrace);
      return null;
    }
  }

  @override
  Future<ProductDetailResponse?> getProductDetailById(int id) async {
    try {
      final response = await _apiClient.get<ProductDetailResponse>(
        'products/$id',
        fromJson: (json) => ProductDetailResponse.fromJson(json),
      );

      if (response.success && response.data != null) {
        return response.data!;
      }
      return null;
    } catch (e, stackTrace) {
      print("Lỗi khi lấy chi tiết sản phẩm theo ID: $e");
      print(stackTrace);
      return null;
    }
  }

  @override
  Future<List<ProductEntity>> getRelatedProducts(int productId, {int limit = 10}) async {
    try {
      final response = await _apiClient.get<List<ProductResponse>>(
        'products/$productId/related',
        queryParameters: {'limit': limit.toString()},
        fromJson: (json) {
          if (json is Map<String, dynamic> && json['content'] != null) {
            final content = json['content'] as List;
            return content.map((e) => ProductResponse.fromJson(e)).toList();
          }
          if (json is List) {
            return json.map((e) => ProductResponse.fromJson(e)).toList();
          }
          return [];
        },
      );

      if (response.success && response.data != null) {
        return response.data!.map((e) => ProductEntity.fromResponse(e)).toList();
      }
      return [];
    } catch (e) {
      print("Lỗi khi lấy sản phẩm liên quan: \$e");
      return [];
    }
  }

  @override
  Future<List<FeedbackEntity>> getProductFeedbacks(int productId) async {
    try {
      final response = await _apiClient.get<List<FeedbackResponse>>(
        'feedbacks/product/$productId',
        fromJson: (json) {
          if (json is List) {
            return json.map((e) => FeedbackResponse.fromJson(e)).toList();
          }
          return [];
        },
      );

      if (response.success && response.data != null) {
        return response.data!.map((e) => FeedbackEntity.fromResponse(e)).toList();
      }
      return [];
    } catch (e) {
      print("Lỗi khi lấy feedback sản phẩm: $e");
      return [];
    }
  }
}
