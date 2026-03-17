import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../models/request/feedback/feedback_request.dart';
import '../../models/response/feedback/feedback_response.dart';
import '../../models/response/feedback/feedback_token_response.dart';
import 'feedback_repository.dart';

class FeedbackRepositoryImpl implements FeedbackRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = '/feedbacks';

  @override
  Future<FeedbackResponse?> submitFeedback(FeedbackRequest request) async {
    try {
      final response = await _apiClient.post<FeedbackResponse>(
        _baseEndpoint,
        data: request.toJson(),
        fromJson: (json) => FeedbackResponse.fromJson(json),
      );
      if (response.success && response.data != null) {
        return response.data;
      }
      return null;
    } catch (e) {
      if (e is DioException) {
        print("❌ ERROR SUBMIT FEEDBACK: ${e.response?.data}");
      }
      return null;
    }
  }

  @override
  Future<List<FeedbackResponse>> getMyFeedbacks() async {
    try {
      final response = await _apiClient.get<List<FeedbackResponse>>(
        '$_baseEndpoint/me',
        fromJson: (json) => (json as List)
            .map((item) => FeedbackResponse.fromJson(item))
            .toList(),
      );
      if (response.success && response.data != null) {
        return response.data!;
      }
      return [];
    } catch (e) {
      print("❌ ERROR GET MY FEEDBACKS: $e");
      return [];
    }
  }

  @override
  Future<FeedbackTokenResponse?> getOrderFeedbackDetails(String orderId, {String? email}) async {
    try {
      final response = await _apiClient.get<FeedbackTokenResponse>(
        '$_baseEndpoint/order-details/$orderId',
        queryParameters: email != null ? {'email': email} : null,
        fromJson: (json) => FeedbackTokenResponse.fromJson(json),
      );
      if (response.success && response.data != null) {
        return response.data;
      }
      return null;
    } catch (e) {
      print("❌ ERROR GET ORDER FEEDBACK DETAILS: $e");
      return null;
    }
  }
}
