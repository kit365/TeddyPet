import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../providers/category/category_provider.dart';
import '../home/widgets/main_header.dart'; 

class CategoryPage extends StatefulWidget {
  const CategoryPage({super.key});

  @override
  State<CategoryPage> createState() => _CategoryPageState();
}

class _CategoryPageState extends State<CategoryPage> {
  @override
  void initState() {
    super.initState();
    // Gọi API để lấy danh mục khi trang được load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CategoryProvider>().fetchCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MainHeader(), // Dùng chung Header với Home
      body: Consumer<CategoryProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }

          if (provider.categories.isEmpty) {
            return const Center(child: Text("Không có danh mục nào"));
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cột bên trái: Danh sách các Category cha (nhỏ giống Shopee/Tiki)
              SizedBox(
                width: 100, // Fixed width
                child: Container(
                  color: const Color(0xFFF5F5F5), // Nền xám nhạt phân cách nhẹ nhàng
                  child: ListView.builder(
                    itemCount: provider.categories.length,
                    itemBuilder: (context, index) {
                      final category = provider.categories[index];
                      final isSelected = index == provider.selectedIndex;

                      return GestureDetector(
                        onTap: () => provider.selectCategory(index),
                        child: Container(
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white : Colors.transparent,
                            border: Border(
                              left: BorderSide(
                                color: isSelected ? AppColors.primary : Colors.transparent,
                                width: 4, // Đường viền chỉ báo đang chọn
                              ),
                              bottom: const BorderSide(
                                color: Color(0xFFE0E0E0), // Viền phân cách xám cực nhẹ
                                width: 0.5,
                              )
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
                          child: Text(
                            category.name,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w400,
                              color: isSelected ? AppColors.primary : Colors.black87,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              
              // Cột bên phải: Grid hiển thị items của Category đang chọn
              Expanded(
                child: Container(
                  color: Colors.white,
                  child: provider.selectedCategoryItems.isEmpty
                      ? const Center(child: Text("Đang cập nhật...", style: TextStyle(color: Colors.grey)))
                      : GridView.builder(
                          padding: const EdgeInsets.all(12),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3, // Layout 3 cột vừa vặn
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.65, // Điều chỉnh độ cao của box
                          ),
                          itemCount: provider.selectedCategoryItems.length,
                          itemBuilder: (context, index) {
                            final item = provider.selectedCategoryItems[index];
                            return Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Hình ảnh sản phẩm phụ
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Image.network(
                                      item.imageUrl ?? '',
                                      fit: BoxFit.contain,
                                      errorBuilder: (_, __, ___) => const Icon(
                                        Icons.image_not_supported,
                                        color: Colors.grey,
                                        size: 32,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                // Text phụ
                                Text(
                                  item.name,
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w400,
                                    color: Colors.black87,
                                    height: 1.2,
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
