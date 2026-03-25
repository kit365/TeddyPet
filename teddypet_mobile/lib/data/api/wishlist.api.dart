import '../../core/network/api_client.dart';
import '../../core/network/api_response.dart';
import '../models/response/wishlist/wishlist_response.dart';

class PageWishlistResponse {
  final List<WishlistResponse> content;
  final int page;
  final int size;
  final int totalElements;
  final int totalPages;
  final bool first;
  final bool last;

  PageWishlistResponse({
    required this.content,
    required this.page,
    required this.size,
    required this.totalElements,
    required this.totalPages,
    required this.first,
    required this.last,
  });

  factory PageWishlistResponse.fromJson(Map<String, dynamic> json) {
    return PageWishlistResponse(
      content: (json['content'] as List?)
              ?.map((e) => WishlistResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      page: json['page'] ?? 0,
      size: json['size'] ?? 0,
      totalElements: json['totalElements'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
      first: json['first'] ?? false,
      last: json['last'] ?? false,
    );
  }
}

class WishlistApi {
  final ApiClient _apiClient;

  WishlistApi(this._apiClient);

  /// Get user's wishlist with pagination
  Future<ApiResponse<PageWishlistResponse>> getMyWishlist({
    int page = 1,
    int size = 12,
  }) async {
    return _apiClient.get<PageWishlistResponse>(
      '/wishlists',
      queryParameters: {
        'page': page,
        'size': size,
      },
      fromJson: (json) => PageWishlistResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  /// Toggle wishlist (add/remove product)
  Future<ApiResponse<void>> toggleWishlist(int productId) async {
    return _apiClient.post<void>(
      '/wishlists/$productId',
    );
  }

  /// Check if product is in wishlist
  Future<ApiResponse<bool>> checkWishlist(int productId) async {
    return _apiClient.get<bool>(
      '/wishlists/check/$productId',
      fromJson: (json) => json as bool,
    );
  }
}
