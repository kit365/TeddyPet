import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../providers/home/home_provider.dart';
import '../../../../providers/common/navigation_provider.dart';
import '../../../../../core/routes/app_routes.dart';

class CategoryMenu extends StatelessWidget {
  const CategoryMenu({super.key});

  @override
  Widget build(BuildContext context) {
    final homeProvider = context.watch<HomeProvider>();
    final categories = homeProvider.categories;

    // 1. Define Fixed Core Items
    final List<Map<String, dynamic>> fixedItems = [
      {
        "label": "Sản phẩm",
        "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-11-1.png",
        "color": const Color(0xFFFFECEE),
        "id": "fixed_products"
      },
      {
        "label": "Dịch vụ",
        "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-1.png",
        "color": const Color(0xFFEAF4FF),
        "id": "fixed_services"
      },
      {
        "label": "Đặt lịch",
        "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/Menu-img-9.png",
        "color": const Color(0xFFE8F7F0),
        "id": "fixed_booking"
      },
      {
        "label": "Bài viết",
        "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-12.png",
        "color": const Color(0xFFFFF4E5),
        "id": "fixed_articles"
      },
    ];

    // 2. Prepare Dynamic Items from API
    // Filter out categories that might conflict with fixed labels if necessary
    final dynamicItems = categories.map((cat) {
      return {
        "label": cat.name,
        "img": cat.imageUrl ?? "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-11-1.png",
        "color": _getCategoryColor(cat.name),
        "id": cat.id,
      };
    }).toList();

    // 3. Combine Items: 4 fixed + up to 4 dynamic (or 3 dynamic + Xem Thêm)
    final List<Map<String, dynamic>> menuItems = [...fixedItems];
    
    if (dynamicItems.isNotEmpty) {
      if (dynamicItems.length <= 4) {
        menuItems.addAll(dynamicItems);
      } else {
        menuItems.addAll(dynamicItems.take(3));
        menuItems.add({
          "label": "Xem Thêm",
          "img": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/07/Menu-img-11-1.png",
          "color": const Color(0xFFEEEEEE),
          "id": "more",
        });
      }
    }

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        itemCount: menuItems.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: 12,
          mainAxisSpacing: 16,
          childAspectRatio: 0.8,
        ),
        itemBuilder: (context, index) {
          final item = menuItems[index];
          return GestureDetector(
            onTap: () {
              if (item['id'] == 'fixed_booking') {
                Navigator.pushNamed(context, AppRoutes.bookingWizard);
              } else if (item['id'] == 'fixed_services') {
                context.read<NavigationProvider>().setTab(1); // Or a specific services page
              } else if (item['id'] == 'fixed_products' || item['id'] == 'more' || categories.any((c) => c.id == item['id'])) {
                context.read<NavigationProvider>().setTab(1); // Chuyển sang tab Danh mục (index 1)
              }
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
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
            ),
          );
        },
      ),
    );
  }

  Color _getCategoryColor(String name) {
    final nameLower = name.toLowerCase();
    if (nameLower.contains('chó')) return const Color(0xFFFFECEE);
    if (nameLower.contains('mèo')) return const Color(0xFFEAF4FF);
    if (nameLower.contains('thức ăn')) return const Color(0xFFF3E5F5);
    if (nameLower.contains('phụ kiện')) return const Color(0xFFE3F2FD);
    if (nameLower.contains('vệ sinh')) return const Color(0xFFE8F7F0);
    return const Color(0xFFFFF4E5);
  }
}

