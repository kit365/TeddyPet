import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';

class CategoryMenu extends StatelessWidget {
  const CategoryMenu({super.key});

  @override
  Widget build(BuildContext context) {
    final menuItems = [
      {"label": "Sản phẩm", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-11-1.png", "color": const Color(0xFFFFECEE)},
      {"label": "Dịch vụ", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-1.png", "color": const Color(0xFFEAF4FF)},
      {"label": "Đặt lịch", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-9.png", "color": const Color(0xFFE8F7F0)},
      {"label": "Bài viết", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-12.png", "color": const Color(0xFFFFF4E5)},
      {"label": "Thức ăn", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-2.png", "color": const Color(0xFFF3E5F5)},
      {"label": "Khuyến mãi", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-9.png", "color": const Color(0xFFFFF0E6)},
      {"label": "Phụ kiện", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-11-1.png", "color": const Color(0xFFE3F2FD)}, 
      {"label": "Xem Thêm", "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-2.png", "color": const Color(0xFFEEEEEE)},
    ];

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(), // Tắt scroll vì nằm trong SingleChildScrollView
        shrinkWrap: true,
        itemCount: menuItems.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          mainAxisSpacing: 16,
          crossAxisSpacing: 12,
          childAspectRatio: 0.8, // Tỉ lệ chiều cao/chiều rộng để có chỗ cho chữ
        ),
        itemBuilder: (context, index) {
          final item = menuItems[index];
          return Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: item['color'] as Color,
                  shape: BoxShape.circle,
                ),
                padding: const EdgeInsets.all(8),
                child: Image.network(
                  item['img'] as String,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(Icons.pets, color: AppColors.secondary, size: 24),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                item['label'] as String,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppColors.secondary,
                  height: 1.2,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

