import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';

class CategoryMenu extends StatelessWidget {
  const CategoryMenu({super.key});

  @override
  Widget build(BuildContext context) {
    final menuItems = [
      {"label": "Trang chủ", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-2.png"},
      {"label": "Dịch vụ", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-1.png"},
      {"label": "Đặt lịch", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-9.png"},
      {"label": "Bài viết", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-12.png"},
      {"label": "Sản phẩm", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-11-1.png"},
    ];

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: SizedBox(
        height: 70,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: menuItems.length,
          separatorBuilder: (context, index) => const SizedBox(width: 25),
          itemBuilder: (context, index) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.network(
                  menuItems[index]['img']!,
                  width: 32,
                  height: 32,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.category, size: 30),
                ),
                const SizedBox(height: 6),
                Text(
                  menuItems[index]['label']!,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.secondary,
                    height: 1.2,
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
