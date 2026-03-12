import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class DatePickerUtils {
  /// Hàm dùng chung để hiện bảng chọn ngày (Date Picker)
  /// Trả về [DateTime?] nếu user chọn ngày, null nếu user bấm Hủy
  static Future<DateTime?> selectDate(
    BuildContext context, {
    DateTime? initialDate,
    DateTime? firstDate,
    DateTime? lastDate,
  }) async {
    return await showDatePicker(
      context: context,
      initialDate: initialDate ?? DateTime.now(),
      firstDate: firstDate ?? DateTime(1960),
      lastDate: lastDate ?? DateTime.now(),
      
      // Tùy chỉnh màu sắc để đồng bộ với TeddyPet
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.secondary, // Màu cam chủ đạo
              onPrimary: Colors.white,
              onSurface: Color(0xFF2C3E50), // Màu chữ
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: AppColors.secondary,
              ),
            ),
          ),
          child: child!,
        );
      },
    );
  }
}
