import 'package:flutter/foundation.dart';
import '../../../../core/network/api_client.dart';
import 'payment_repository.dart';

class PaymentRepositoryImpl implements PaymentRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = 'payments';

  @override
  Future<String?> createPaymentUrl({
    required String orderId,
    required String gateway,
    String? returnUrl,
  }) async {
    try {
      debugPrint("--- PaymentRepositoryImpl: POST $_baseEndpoint/create with parameters: {orderId: $orderId, gateway: $gateway, returnUrl: $returnUrl} ---");
      final response = await _apiClient.post<String>(
        '$_baseEndpoint/create',
        queryParameters: {
          'orderId': orderId,
          'gateway': gateway,
          if (returnUrl != null) 'returnUrl': returnUrl,
        },
      );

      if (response.success && response.data != null) {
        return response.data;
      }
      return null;
    } catch (e) {
      print("Lỗi khi createPaymentUrl: $e");
      return null;
    }
  }
}
