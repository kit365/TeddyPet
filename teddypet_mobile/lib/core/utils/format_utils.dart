import 'package:intl/intl.dart';

class FormatUtils {
  static String formatCurrency(num? amount) {
    return NumberFormat.currency(
      locale: 'vi_VN',
      symbol: '₫',
      decimalDigits: 0,
    ).format(amount ?? 0);
  }
}
