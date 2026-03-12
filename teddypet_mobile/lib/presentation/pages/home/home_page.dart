import 'package:flutter/material.dart';
import 'package:teddypet_mobile/presentation/pages/home/widgets/main_header.dart';
import '../../../core/theme/app_colors.dart';
import './widgets/home/category_menu.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MainHeader(),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const CategoryMenu(),
            const SizedBox(height: 10),

            _buildSectionPlaceholder('Thương hiệu nổi bật'),
            const SizedBox(height: 10),

            _buildSectionPlaceholder('Dịch vụ hiện có'),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionPlaceholder(String title) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.secondary,
                ),
              ),
              const Text(
                'Xem tất cả >',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.secondary
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Container(
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: const Center(
              child: Text(
                'Nội dung trống (Đang cập nhật Layout)',
                style: TextStyle(color: Colors.grey),
              ),
            ),
          )
        ],
      ),
    );
  }
}

