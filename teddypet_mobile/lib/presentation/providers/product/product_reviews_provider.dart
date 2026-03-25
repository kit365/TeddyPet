import 'package:flutter/material.dart';
import '../../../data/models/response/feedback/feedback_response.dart';
import '../../../data/models/entities/feedback/feedback_entity.dart';
import '../../controllers/product/product_controller.dart';

class ProductReviewsProvider extends ChangeNotifier {
  final ProductController _productController;

  ProductReviewsProvider(this._productController);

  List<FeedbackEntity> _reviews = [];
  List<FeedbackEntity> get reviews => _reviews;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  int _selectedFilter = 0; // 0 for all, 1-5 for stars
  int get selectedFilter => _selectedFilter;

  Future<void> fetchReviews(int productId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reviews = await _productController.getProductFeedbacks(productId);
    } catch (e) {
      _error = "Lỗi khi tải đánh giá: $e";
      debugPrint("Error fetching reviews: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setFilter(int star) {
    _selectedFilter = star;
    notifyListeners();
  }

  List<FeedbackEntity> get filteredReviews {
    if (_selectedFilter == 0) return _reviews;
    return _reviews.where((r) => r.rating == _selectedFilter).toList();
  }

  Map<int, int> get reviewCounts {
    final counts = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    for (var r in _reviews) {
      if (counts.containsKey(r.rating)) {
        counts[r.rating] = (counts[r.rating] ?? 0) + 1;
      }
    }
    return counts;
  }
}
