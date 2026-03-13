import 'package:flutter/material.dart';
import 'package:teddypet_mobile/core/theme/app_colors.dart';

class ProductReviewsPage extends StatefulWidget {
  final double rating;
  final int totalReviews;
  final String productName;

  const ProductReviewsPage({
    super.key,
    required this.rating,
    required this.totalReviews,
    required this.productName,
  });

  @override
  State<ProductReviewsPage> createState() => _ProductReviewsPageState();
}

class _ProductReviewsPageState extends State<ProductReviewsPage> {
  int _selectedFilter = 0;

  final List<_ProductReview> _reviews = const [
    _ProductReview(
      author: 'x*****8',
      rating: 5,
      createdAt: '26/09/2025',
      content: 'Thơm dễ chịu, tạo bọt tốt và sạch sâu. Dùng xong tóc mềm, cảm giác rất đáng tiền.',
      helpfulCount: 1,
    ),
    _ProductReview(
      author: 'trung03182',
      rating: 5,
      createdAt: '18/09/2025',
      content: 'Shop gói hàng cẩn thận, giao nhanh. Sản phẩm ổn hơn mong đợi, dùng thực tế thấy rất đáng mua.',
      helpfulCount: 2,
    ),
    _ProductReview(
      author: 'mai.nguyen',
      rating: 4,
      createdAt: '10/09/2025',
      content: 'Mùi ổn, giao hàng nhanh. Nếu giá tốt thêm chút nữa thì quá đẹp.',
      helpfulCount: 0,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final reviewCounts = {
      5: _reviews.where((review) => review.rating == 5).length,
      4: _reviews.where((review) => review.rating == 4).length,
      3: _reviews.where((review) => review.rating == 3).length,
      2: _reviews.where((review) => review.rating == 2).length,
      1: _reviews.where((review) => review.rating == 1).length,
    };

    final visibleReviews = _selectedFilter == 0
        ? _reviews
        : _reviews.where((review) => review.rating == _selectedFilter).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF6F6F6),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        titleSpacing: 0,
        title: const Text(
          'Đánh giá',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '${widget.totalReviews} đánh giá',
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
                        subtitle: '(${_reviews.length})',
                        isSelected: _selectedFilter == 0,
                        onTap: () => setState(() => _selectedFilter = 0),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildCompactFilterChip(
                        label: 'Sao',
                        subtitle: _selectedFilter == 0 ? 'Tất cả' : '$_selectedFilter sao',
                        isSelected: _selectedFilter != 0,
                        onTap: () => _openRatingFilterSheet(reviewCounts),
                        trailing: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
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
                              review.author.substring(0, 1).toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFF68707A),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              review.author,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(Icons.thumb_up_outlined, size: 18, color: Color(0xFF7A7A7A)),
                              const SizedBox(width: 4),
                              Text(
                                'Hữu ích (${review.helpfulCount})',
                                style: const TextStyle(fontSize: 13, color: Color(0xFF666666)),
                              ),
                            ],
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
                        review.createdAt,
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        review.content,
                        style: const TextStyle(
                          fontSize: 15,
                          height: 1.45,
                          color: Color(0xFF2B2B2B),
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

  void _openRatingFilterSheet(Map<int, int> reviewCounts) {
    int tempFilter = _selectedFilter;

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
              child: Padding(
                padding: const EdgeInsets.fromLTRB(0, 10, 0, 18),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 44,
                      child: Divider(thickness: 4, color: Color(0xFFD9D9D9)),
                    ),
                    const SizedBox(height: 8),
                    ...[0, 5, 4, 3, 2, 1].map((star) {
                      final isSelected = tempFilter == star;
                      final count = star == 0 ? _reviews.length : (reviewCounts[star] ?? 0);

                      return InkWell(
                        onTap: () => setModalState(() => tempFilter = star),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(color: Colors.grey.shade200),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected ? AppColors.primary : const Color(0xFF8D8D8D),
                                    width: 2,
                                  ),
                                ),
                                child: isSelected
                                    ? Center(
                                        child: Container(
                                          width: 12,
                                          height: 12,
                                          decoration: const BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 18),
                              if (star == 0)
                                Text(
                                  'Tất cả $count',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFF444444),
                                  ),
                                )
                              else
                                Row(
                                  children: [
                                    ...List.generate(
                                      5,
                                      (index) => Padding(
                                        padding: const EdgeInsets.only(right: 2),
                                        child: Icon(
                                          Icons.star,
                                          size: 18,
                                          color: index < star ? const Color(0xFFFFB400) : Colors.grey[300],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '$count',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF666666),
                                      ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                    const SizedBox(height: 18),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() => _selectedFilter = 0);
                                Navigator.pop(context);
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                side: const BorderSide(color: AppColors.primary),
                                minimumSize: const Size.fromHeight(50),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              child: const Text('Bỏ lọc', style: TextStyle(fontSize: 16)),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                setState(() => _selectedFilter = tempFilter);
                                Navigator.pop(context);
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                minimumSize: const Size.fromHeight(50),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              child: const Text(
                                'ĐỒNG Ý',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _ProductReview {
  final String author;
  final int rating;
  final String createdAt;
  final String content;
  final int helpfulCount;

  const _ProductReview({
    required this.author,
    required this.rating,
    required this.createdAt,
    required this.content,
    required this.helpfulCount,
  });
}
