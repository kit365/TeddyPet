import 'package:flutter/material.dart';
import '../../../data/repositories/payment/payment_repository.dart';
import '../../../data/repositories/payment/payment_repository_impl.dart';

class PaymentProvider with ChangeNotifier {
  final PaymentRepository _paymentRepository = PaymentRepositoryImpl();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  Future<String?> createPaymentUrl({
    required String orderId,
    required String gateway,
    String? returnUrl,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    debugPrint("--- PaymentProvider: Calling _paymentRepository.createPaymentUrl for $orderId ---");
    try {
      final url = await _paymentRepository.createPaymentUrl(
        orderId: orderId,
        gateway: gateway,
        returnUrl: returnUrl,
      );

      debugPrint("--- PaymentProvider: URL Result: $url ---");
      if (url == null) {
        _errorMessage = "Không thể tạo link thanh toán. Vui lòng thử lại sau.";
      }
      return url;
    } catch (e) {
      debugPrint("--- PaymentProvider: EXCEPTION: $e ---");
      _errorMessage = "Lỗi hệ thống khi tạo thanh toán: $e";
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
