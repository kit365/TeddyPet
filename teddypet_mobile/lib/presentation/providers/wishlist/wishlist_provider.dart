import 'package:flutter/material.dart';
import '../../../data/models/response/wishlist/wishlist_response.dart';
import '../../../presentation/controllers/wishlist/wishlist_controller.dart';

class WishlistProvider extends ChangeNotifier {
  final WishlistController _controller;

  List<WishlistResponse> _wishlistItems = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  int _totalElements = 0;

  WishlistProvider(this._controller);

  // Getters
  List<WishlistResponse> get wishlistItems => _wishlistItems;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get totalElements => _totalElements;
  bool get hasNextPage => _currentPage < _totalPages;
  bool get hasPreviousPage => _currentPage > 1;

  Future<void> getMyWishlist({int page = 1, int size = 12}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _controller.getMyWishlist(page: page, size: size);
      _wishlistItems = result.content;
      _currentPage = result.page + 1; // Backend returns 0-indexed page
      _totalPages = result.totalPages;
      _totalElements = result.totalElements;
    } catch (e) {
      _error = _handleError(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleWishlist(int productId) async {
    try {
      await _controller.toggleWishlist(productId);
      // Refresh list after toggling
      await getMyWishlist(page: _currentPage);
    } catch (e) {
      _error = _handleError(e);
      notifyListeners();
    }
  }

  Future<bool> checkWishlist(int productId) async {
    try {
      return await _controller.checkWishlist(productId);
    } catch (e) {
      _error = _handleError(e);
      notifyListeners();
      return false;
    }
  }

  void goToPage(int page) {
    if (page > 0 && page <= _totalPages) {
      getMyWishlist(page: page);
    }
  }

  void nextPage() {
    if (hasNextPage) {
      goToPage(_currentPage + 1);
    }
  }

  void previousPage() {
    if (hasPreviousPage) {
      goToPage(_currentPage - 1);
    }
  }

  String _handleError(dynamic error) {
    if (error is Exception) {
      final message = error.toString();
      if (message.contains('401') || message.contains('Unauthorized')) {
        return 'Vui lòng đăng nhập để xem danh sách yêu thích';
      }
      if (message.contains('404') || message.contains('Not Found')) {
        return 'Danh sách yêu thích không được tìm thấy';
      }
      if (message.contains('Connection')) {
        return 'Lỗi kết nối. Vui lòng kiểm tra mạng';
      }
      return message.replaceAll('Exception: ', '');
    }
    return 'Đã xảy ra lỗi. Vui lòng thử lại';
  }
}
