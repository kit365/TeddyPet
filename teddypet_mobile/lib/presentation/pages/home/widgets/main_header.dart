import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../providers/auth/auth_provider.dart';

class MainHeader extends StatelessWidget implements PreferredSizeWidget {
  const MainHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              // 1. Logo thu nhỏ mỏng nhẹ lại cho tinh tế
              Image.network(
                'https://i.imgur.com/V2kwkkK.png',
                height: 28, // Đã giảm size để cân đối với icon
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Icon(Icons.pets, color: AppColors.primary, size: 28),
              ),
              const SizedBox(width: 12),

              // 2. Thanh tìm kiếm hiện đại
              Expanded(
                child: Container(
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F3F5), // Màu xám rất nhẹ
                    borderRadius: BorderRadius.circular(8), // Bo góc 8px nhìn thanh lịch hơn
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: const Row(
                    children: [
                      Icon(Icons.search, color: Colors.grey, size: 18),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          "Tìm kiếm", // Rút gọn chữ để không bị lỗi "Tìm ki..."
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // 3. Icons (Dùng GestureDetector để tránh padding thừa của IconButton)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      color: Colors.transparent, // Để dễ bấm
                      child: const Icon(Icons.favorite_border, color: AppColors.secondary, size: 24),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      color: Colors.transparent,
                      child: const Icon(Icons.location_on_outlined, color: AppColors.secondary, size: 24),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      padding: const EdgeInsets.only(left: 6, right: 0, top: 4, bottom: 4), // Icon cuối cùng bỏ padding phải cho sát mép ngang
                      color: Colors.transparent,
                      child: const Icon(Icons.inventory_2_outlined, color: AppColors.secondary, size: 24),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(64);
}
