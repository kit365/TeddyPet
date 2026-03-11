import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class MainHeader extends StatelessWidget implements PreferredSizeWidget {
  const MainHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Color(0x1A102937), width: 1),
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Column(
            children: [

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [

                  Image.network(
                    'https://i.imgur.com/V2kwkkK.png',
                    height: 32,
                    fit: BoxFit.contain,
                  ),
                  
                  // Nhóm Action Icons (Trái tim, Túi xách, User)
                  Row(
                    children: [
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        onPressed: () {},
                        icon: const Icon(Icons.favorite_border_rounded, color: AppColors.secondary, size: 22),
                      ),
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        onPressed: () {},
                        icon: const Icon(Icons.shopping_bag_outlined, color: AppColors.secondary, size: 22),
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () {
                          Navigator.pushNamed(context, '/login');
                        },
                        child: const Icon(Icons.person_outline_rounded, color: AppColors.secondary, size: 24),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              

              Container(
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0x08102937), // Màu nền xám nhạt mờ mờ (#10293708)
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(color: const Color(0xFFD7D7D7)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        "Tìm kiếm sản phẩm",
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                    ),
                    Container(
                      width: 32,
                      height: 32,
                      decoration: const BoxDecoration(
                        color: AppColors.secondary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.search, color: Colors.white, size: 18),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(130);
}
