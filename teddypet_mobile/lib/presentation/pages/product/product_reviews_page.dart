import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/product/product_reviews_provider.dart';
import 'models/product_reviews_arguments.dart';

class ProductReviewsPage extends StatefulWidget {
  final ProductReviewsArguments args;

  const ProductReviewsPage({
    super.key,
    required this.args,
  });

  @override
  State<ProductReviewsPage> createState() => _ProductReviewsPageState();
}

class _ProductReviewsPageState extends State<ProductReviewsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductReviewsProvider>().fetchReviews(widget.args.productId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ProductReviewsProvider>(
      builder: (context, provider, child) {
        final reviewCounts = provider.reviewCounts;
        final visibleReviews = provider.filteredReviews;

        return Scaffold(
          backgroundColor: const Color(0xFFF6F6F6),
          appBar: AppBar(
            backgroundColor: Colors.white,
            foregroundColor: Colors.black87,
            elevation: 0,
            titleSpacing: 0,
            title: const Text(
              'Đánh giá sản phẩm',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
          ),
          body: provider.isLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : provider.error != null
                  ? Center(child: Text(provider.error!, style: const TextStyle(color: Colors.red)))
                  : Column(
                      children: [
                        Container(
                          color: Colors.white,
                          padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
                          child: Column(
                            children: [
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  '${provider.reviews.length} đánh giá',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildCompactFilterChip(
                                      label: 'Tất cả',
                                      subtitle: '(${provider.reviews.length})',
                                      isSelected: provider.selectedFilter == 0,
                                      onTap: () => provider.setFilter(0),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: _buildCompactFilterChip(
                                      label: 'Sao',
                                      subtitle: provider.selectedFilter == 0 
                                          ? 'Tất cả' 
                                          : '${provider.selectedFilter} sao',
                                      isSelected: provider.selectedFilter != 0,
                                      onTap: () => _openRatingFilterSheet(provider),
                                      trailing: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: provider.reviews.isEmpty
                              ? _buildEmptyState()
                              : ListView.separated(
                                  padding: const EdgeInsets.only(top: 10),
                                  itemCount: visibleReviews.length,
                                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                                  itemBuilder: (context, index) {
                                    final review = visibleReviews[index];
                                    return Container(
                                      color: Colors.white,
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              CircleAvatar(
                                                radius: 18,
                                                backgroundColor: const Color(0xFFEFF1F3),
                                                child: Text(
                                                  (review.userName).isNotEmpty 
                                                      ? review.userName.substring(0, 1).toUpperCase()
                                                      : 'U',
                                                  style: const TextStyle(
                                                    color: Color(0xFF68707A),
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 10),
                                              Expanded(
                                                child: Text(
                                                  review.userName,
                                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 12),
                                          Row(
                                            children: List.generate(
                                              5,
                                              (starIndex) => Icon(
                                                Icons.star,
                                                size: 18,
                                                color: starIndex < review.rating ? Colors.amber : Colors.grey[300],
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            DateFormat('dd/MM/yyyy HH:mm').format(review.createdAt),
                                            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                                          ),
                                          const SizedBox(height: 10),
                                          Text(
                                            review.comment,
                                            style: const TextStyle(
                                              fontSize: 15,
                                              height: 1.45,
                                              color: Color(0xFF2B2B2B),
                                            ),
                                          ),
                                          if (review.replyComment != null && review.replyComment!.isNotEmpty)
                                            Container(
                                              margin: const EdgeInsets.only(top: 12),
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF8F9FA),
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(color: Colors.grey.shade200),
                                              ),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  const Text(
                                                    'Phản hồi từ shop:',
                                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.secondary),
                                                  ),
                                                  const SizedBox(height: 6),
                                                  Text(
                                                    review.replyComment!,
                                                    style: const TextStyle(fontSize: 14, color: Color(0xFF444444)),
                                                  ),
                                                ],
                                              ),
                                            ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                        ),
                      ],
                    ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.rate_review_outlined, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'Chưa có đánh giá nào',
            style: TextStyle(fontSize: 16, color: Colors.grey[600], fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactFilterChip({
    required String label,
    required String subtitle,
    required bool isSelected,
    required VoidCallback onTap,
    Widget? trailing,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFF7F7) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFFFFC9C9) : const Color(0xFFEAEAEA),
            width: 1.1,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected ? const Color(0x0DFF6262) : const Color(0x08000000),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                      color: isSelected ? AppColors.primary : const Color(0xFF2F2F2F),
                      height: 1.05,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12.5,
                      color: isSelected ? const Color(0xFFFF8A8A) : const Color(0xFF8B8B8B),
                      fontWeight: FontWeight.w500,
                      height: 1,
                    ),
                  ),
                ],
              ),
            ),
            if (trailing != null)
              IconTheme(
                data: IconThemeData(
                  color: isSelected ? const Color(0xFFFF8A8A) : const Color(0xFFAAAAAA),
                ),
                child: trailing,
              ),
          ],
        ),
      ),
    );
  }

  void _openRatingFilterSheet(ProductReviewsProvider provider) {
    int tempFilter = provider.selectedFilter;
    final reviewCounts = provider.reviewCounts;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  const SizedBox(
                    width: 44,
                    child: Divider(thickness: 4, color: Color(0xFFD9D9D9)),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Lọc theo số sao', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                        IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                      ],
                    ),
                  ),
                  ...[0, 5, 4, 3, 2, 1].map((star) {
                    final isSelected = tempFilter == star;
                    final count = star == 0 ? provider.reviews.length : (reviewCounts[star] ?? 0);

                    return InkWell(
                      onTap: () => setModalState(() => tempFilter = star),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        child: Row(
                          children: [
                            Radio<int>(
                              value: star,
                              groupValue: tempFilter,
                              onChanged: (val) => setModalState(() => tempFilter = val!),
                              activeColor: AppColors.primary,
                            ),
                            const SizedBox(width: 8),
                            if (star == 0)
                              Text('Tất cả ($count)', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500))
                            else
                              Row(
                                children: [
                                  ...List.generate(
                                    5,
                                    (index) => Icon(
                                      Icons.star,
                                      size: 18,
                                      color: index < star ? const Color(0xFFFFB400) : Colors.grey[300],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text('($count)', style: const TextStyle(fontSize: 16, color: Colors.grey)),
                                ],
                              ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              provider.setFilter(0);
                              Navigator.pop(context);
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              side: const BorderSide(color: AppColors.primary),
                              minimumSize: const Size.fromHeight(50),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('Xóa lọc', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              provider.setFilter(tempFilter);
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              minimumSize: const Size.fromHeight(50),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('ÁP DỤNG', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
