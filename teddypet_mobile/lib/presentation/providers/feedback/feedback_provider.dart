import 'package:flutter/material.dart';
import '../../../data/models/request/feedback/feedback_request.dart';
import '../../../data/models/response/feedback/feedback_token_response.dart';
import '../../controllers/feedback/feedback_controller.dart';

class FeedbackProvider extends ChangeNotifier {
  final FeedbackController _controller;

  FeedbackProvider(this._controller);

  FeedbackTokenResponse? _feedbackDetails;
  FeedbackTokenResponse? get feedbackDetails => _feedbackDetails;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  Future<void> fetchOrderFeedbackDetails(String orderId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _feedbackDetails = await _controller.getOrderFeedbackDetails(orderId);
      if (_feedbackDetails == null) {
        _errorMessage = "Không tìm thấy thông tin đánh giá.";
      }
    } catch (e) {
      debugPrint("Lỗi khi lấy thông tin đánh giá: $e");
      _errorMessage = "Không thể tải thông tin đánh giá.";
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Kiểm tra xem toàn bộ đơn hàng đã được đánh giá chưa
  Future<bool> isOrderAllReviewed(String orderId) async {
    try {
      final details = await _controller.getOrderFeedbackDetails(orderId);
      if (details != null && details.items.isNotEmpty) {
        return details.items.every((item) => item.isSubmitted);
      }
      return false;
    } catch (e) {
      debugPrint("Error checking review status: $e");
      return false;
    }
  }

  Future<bool> submitFeedback(FeedbackRequest request) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _controller.submitFeedback(request);
      return response != null;
    } catch (e) {
      debugPrint("Lỗi khi gửi đánh giá: $e");
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearDetails() {
    _feedbackDetails = null;
    notifyListeners();
  }
}
