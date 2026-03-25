abstract class PaymentRepository {
  Future<String?> createPaymentUrl({
    required String orderId,
    required String gateway,
    String? returnUrl,
  });
}
