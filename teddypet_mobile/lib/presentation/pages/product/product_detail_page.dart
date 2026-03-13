import 'package:flutter/material.dart';
import 'package:teddypet_mobile/core/routes/app_routes.dart';
import 'package:teddypet_mobile/core/theme/app_colors.dart';
import 'package:teddypet_mobile/data/mock/product_detail_mock_data.dart';
import 'package:teddypet_mobile/data/models/response/product/product_detail_response.dart';

class ProductDetailPage extends StatefulWidget {
  final String? slug;

  const ProductDetailPage({super.key, this.slug});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  static const Color _mutedPriceColor = Color(0xFF9B9B9B);
  static const Color _promoTagBg = Color(0xFFFFF1F1);
  static const Color _promoTagBorder = Color(0xFFFFD6D6);

  late ProductDetailResponse _product;
  final PageController _imageController = PageController();
  int _currentImageIndex = 0;
  int _quantity = 1;
  bool _isFavorite = false;
  final Map<int, int> _selectedOptions = {}; // attributeId -> valueId

  final List<_MockReview> _reviews = const [
    _MockReview(
      author: 'Nguyễn Hoàng Minh',
      rating: 5,
      content:
          'Bé nhà mình ăn rất hợp, lông bóng hơn sau khoảng 2 tuần. Mùi hạt thơm, không bị hắc.',
      createdAt: '2 ngày trước',
    ),
    _MockReview(
      author: 'Trần Mỹ Linh',
      rating: 4,
      content: 'Đóng gói ổn, giao nhanh. Bé hơi kén vị bò nhưng vị gà ăn tốt.',
      createdAt: '1 tuần trước',
    ),
  ];

  final List<_MockRelatedProduct> _relatedProducts = const [
    _MockRelatedProduct(
      slug: 'hat-an-cho-cho-truong-thanh',
      name: 'Hạt cho chó Premium vị gà',
      price: 129000,
      imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
    ),
    _MockRelatedProduct(
      slug: 'snack-thuong-cho-cho',
      name: 'Snack thưởng mềm cho chó',
      price: 89000,
      imageUrl: 'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=800',
    ),
    _MockRelatedProduct(
      slug: 'pate-tuoi-cho-cho',
      name: 'Pate tươi dinh dưỡng TeddyPet',
      price: 59000,
      imageUrl: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _product = ProductDetailMockData.bySlug(widget.slug);
  }

  @override
  void dispose() {
    _imageController.dispose();
    super.dispose();
  }

  ProductVariantResponse? get _selectedVariant {
    if (_product.attributes.isEmpty) {
      return _product.variants.isNotEmpty ? _product.variants.first : null;
    }

    final selectedAll = _product.attributes.every(
      (a) => _selectedOptions[a.attributeId] != null,
    );

    if (!selectedAll) return null;

    try {
      return _product.variants.firstWhere((variant) {
        return variant.attributes.every(
          (attr) => _selectedOptions[attr.attributeId] == attr.valueId,
        );
      });
    } catch (_) {
      return null;
    }
  }

  ProductVariantResponse? _findVariantBySelection(Map<int, int> selectedOptions) {
    if (_product.attributes.isEmpty) {
      return _product.variants.isNotEmpty ? _product.variants.first : null;
    }

    final selectedAll = _product.attributes.every(
      (a) => selectedOptions[a.attributeId] != null,
    );

    if (!selectedAll) return null;

    try {
      return _product.variants.firstWhere((variant) {
        return variant.attributes.every(
          (attr) => selectedOptions[attr.attributeId] == attr.valueId,
        );
      });
    } catch (_) {
      return null;
    }
  }

  ProductVariantResponse? _findPreviewVariantByPartialSelection(Map<int, int> selectedOptions) {
    if (_product.variants.isEmpty) return null;
    if (selectedOptions.isEmpty) return _product.variants.first;

    for (final variant in _product.variants) {
      final matchedAllSelected = selectedOptions.entries.every((entry) {
        return variant.attributes.any(
          (attr) => attr.attributeId == entry.key && attr.valueId == entry.value,
        );
      });
      if (matchedAllSelected) return variant;
    }

    return _product.variants.first;
  }

  String _formatCurrency(double value) {
    final text = value.toStringAsFixed(0);
    final reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    return text.replaceAllMapped(reg, (m) => '${m[1]}.') + 'đ';
  }

  Widget _buildPriceRow({
    required double price,
    double? originalPrice,
    required double priceFontSize,
    required double originalFontSize,
    double spacing = 8,
    FontWeight priceWeight = FontWeight.w700,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(
          _formatCurrency(price),
          style: TextStyle(
            fontSize: priceFontSize,
            fontWeight: priceWeight,
            color: AppColors.primary,
            height: 1,
          ),
        ),
        if (originalPrice != null) ...[
          SizedBox(width: spacing),
          Text(
            _formatCurrency(originalPrice),
            style: const TextStyle(
              fontSize: 14,
              color: _mutedPriceColor,
              decoration: TextDecoration.lineThrough,
              decorationColor: _mutedPriceColor,
              fontWeight: FontWeight.w500,
              height: 1,
            ).copyWith(fontSize: originalFontSize),
          ),
        ],
      ],
    );
  }

  List<ProductAttributeValueResponse> _valuesForAttribute(int attributeId) {
    final map = <int, ProductAttributeValueResponse>{};
    for (final v in _product.variants) {
      for (final attr in v.attributes) {
        if (attr.attributeId == attributeId) {
          map[attr.valueId] = attr;
        }
      }
    }
    final values = map.values.toList();
    values.sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
    return values;
  }

  @override
  Widget build(BuildContext context) {
    final variant = _selectedVariant;
    final displayPrice = variant?.displayPrice ?? _product.minPrice;
    final originalPrice = variant?.hasSale == true
        ? variant!.price
        : (_product.maxPrice > _product.minPrice ? _product.maxPrice : null);
    final stock = variant?.stockQuantity ?? 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: AppBar(
        title: const Text('Chi tiết sản phẩm'),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              onPressed: _toggleFavorite,
              icon: AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
                child: Icon(
                  _isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  key: ValueKey(_isFavorite),
                  color: _isFavorite ? AppColors.primary : AppColors.secondary,
                ),
              ),
              tooltip: 'Yêu thích sản phẩm',
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageSection(),
            _buildInfoSection(displayPrice, originalPrice),
            if (_product.attributes.isEmpty) _buildQuantitySection(stock),
            _buildHighlightsSection(),
            _buildDescriptionSection(),
            _buildReviewSection(),
            _buildRelatedSection(),
            const SizedBox(height: 120),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(stock),
    );
  }

  Widget _buildImageSection() {
    final images = _product.images;

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          SizedBox(
            height: 300,
            child: PageView.builder(
              controller: _imageController,
              itemCount: images.isEmpty ? 1 : images.length,
              onPageChanged: (index) {
                setState(() => _currentImageIndex = index);
              },
              itemBuilder: (context, index) {
                final imageUrl = images.isEmpty
                    ? 'https://placehold.co/800x800'
                    : images[index].imageUrl;
                return Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  errorBuilder: (_, __, ___) => const Center(
                    child: Icon(Icons.image_not_supported_outlined, size: 42),
                  ),
                );
              },
            ),
          ),
          if (images.length > 1)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(images.length, (index) {
                  final active = index == _currentImageIndex;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    height: 6,
                    width: active ? 18 : 6,
                    decoration: BoxDecoration(
                      color: active ? AppColors.primary : Colors.grey[350],
                      borderRadius: BorderRadius.circular(20),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(double displayPrice, double? originalPrice) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _product.name,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.star, size: 18, color: Colors.amber),
              const SizedBox(width: 4),
              Text(
                _product.averageRating.toStringAsFixed(1),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 8),
              Text(
                '(${_product.ratingCount} đánh giá)',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const SizedBox(width: 8),
              Text(
                '• Đã bán ${_product.soldCount}',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildPriceRow(
            price: displayPrice,
            originalPrice: originalPrice,
            priceFontSize: 24,
            originalFontSize: 15,
            spacing: 10,
            priceWeight: FontWeight.w800,
          ),
          const SizedBox(height: 12),
          _buildPriceTags(),
        ],
      ),
    );
  }

  Widget _buildPriceTags() {
    final tagNames = _product.tags
        .map((e) => (e is Map<String, dynamic>) ? (e['name']?.toString() ?? '') : '')
        .where((e) => e.trim().isNotEmpty)
        .toList();

    final chips = <String>[
      if (tagNames.isNotEmpty) ...tagNames,
      if (tagNames.isEmpty) 'Bán chạy',
      'Freeship nội thành',
      'Đổi trả 7 ngày',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: chips
          .map(
            (chip) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: _promoTagBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _promoTagBorder),
              ),
              child: Text(
                chip,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildQuantitySection(int stock) {
    final outOfStock = stock <= 0;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Kho: $stock sản phẩm',
            style: TextStyle(
              fontSize: 13,
              color: outOfStock ? Colors.redAccent : Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _qtyButton(Icons.remove, () {
                if (_quantity > 1) {
                  setState(() => _quantity--);
                }
              }),
              Container(
                width: 54,
                alignment: Alignment.center,
                child: Text(
                  '$_quantity',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
              _qtyButton(Icons.add, () {
                final max = stock <= 0 ? 1 : stock;
                if (_quantity < max) {
                  setState(() => _quantity++);
                }
              }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18),
      ),
    );
  }

  Widget _buildDescriptionSection() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Mô tả sản phẩm',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: AppColors.secondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _product.description,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[800],
              height: 1.45,
            ),
          ),
          const SizedBox(height: 12),
          Text('Xuất xứ: ${_product.origin}', style: const TextStyle(fontSize: 13)),
          const SizedBox(height: 4),
          Text('Thành phần: ${_product.material}', style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildHighlightsSection() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: const [
          _HighlightItem(icon: Icons.local_shipping_outlined, title: 'Giao nhanh'),
          _HighlightItem(icon: Icons.verified_outlined, title: 'Hàng chính hãng'),
          _HighlightItem(icon: Icons.swap_horiz_outlined, title: 'Đổi trả 7 ngày'),
        ],
      ),
    );
  }

  Widget _buildReviewSection() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: _openReviewsPage,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Text(
                    _product.averageRating.toStringAsFixed(1),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF222222),
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.star, size: 24, color: Colors.amber),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Đánh Giá Sản Phẩm (${_product.ratingCount})',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF222222),
                      ),
                    ),
                  ),
                  Icon(Icons.chevron_right, color: Colors.grey[400]),
                ],
              ),
            ),
          ),
          Divider(height: 1, color: Colors.grey.shade200),
          const SizedBox(height: 12),
          ..._reviews.map(
            (review) => Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFC),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
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
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                      ),
                      Text(
                        review.createdAt,
                        style: TextStyle(color: Colors.grey[500], fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: List.generate(
                      5,
                      (i) => Icon(
                        Icons.star,
                        size: 16,
                        color: i < review.rating ? Colors.amber : Colors.grey[300],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    review.content,
                    style: TextStyle(color: Colors.grey[800], fontSize: 14, height: 1.45),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _openReviewsPage,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: Color(0xFFFFCFC4)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Xem tất cả đánh giá'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openReviewsPage() {
    Navigator.pushNamed(
      context,
      AppRoutes.productReviews,
      arguments: {
        'rating': _product.averageRating,
        'totalReviews': _product.ratingCount,
        'productName': _product.name,
      },
    );
  }

  void _toggleFavorite() {
    setState(() => _isFavorite = !_isFavorite);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isFavorite ? 'Đã thêm vào yêu thích.' : 'Đã bỏ khỏi yêu thích.',
        ),
        duration: const Duration(milliseconds: 1200),
      ),
    );
  }

  Widget _buildRelatedSection() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.fromLTRB(16, 16, 0, 16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(right: 16),
            child: Text(
              'Sản phẩm liên quan',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
                color: AppColors.secondary,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _relatedProducts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final item = _relatedProducts[index];
                return InkWell(
                  onTap: () {
                    Navigator.pushReplacementNamed(
                      context,
                      AppRoutes.productDetail,
                      arguments: item.slug,
                    );
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 160,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                          child: Image.network(
                            item.imageUrl,
                            height: 120,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _formatCurrency(item.price),
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
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
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(int stock) {
    final canBuy = _product.attributes.isEmpty ? stock > 0 : true;

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: canBuy
                  ? () {
                      _onTapAction(isBuyNow: false);
                    }
                  : null,
              icon: const Icon(Icons.shopping_cart_outlined),
              label: const Text('Thêm vào giỏ'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.secondary,
                side: const BorderSide(color: AppColors.secondary),
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton(
              onPressed: canBuy
                  ? () {
                      _onTapAction(isBuyNow: true);
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Mua ngay'),
            ),
          ),
        ],
      ),
    );
  }

  void _onTapAction({required bool isBuyNow}) {
    if (_product.attributes.isNotEmpty && _selectedVariant == null) {
      _showVariantPickerSheet(isBuyNow: isBuyNow);
      return;
    }

    final variant = _selectedVariant;
    final stock = variant?.stockQuantity ?? 0;
    if (stock <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sản phẩm đã hết hàng.')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isBuyNow ? 'Mua ngay (mock).' : 'Đã thêm vào giỏ hàng (mock).'),
      ),
    );
  }

  void _showVariantPickerSheet({required bool isBuyNow}) {
    final tempSelected = Map<int, int>.from(_selectedOptions);
    int tempQty = _quantity;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final variant = _findVariantBySelection(tempSelected);
            final previewVariant =
              variant ?? _findPreviewVariantByPartialSelection(tempSelected);
            final previewImageUrl = previewVariant?.featuredImageUrl ??
              (_product.images.isNotEmpty ? _product.images.first.imageUrl : 'https://placehold.co/300x300');
            final previewDisplayPrice = previewVariant?.displayPrice ?? _product.minPrice;
            final previewOriginalPrice = previewVariant?.hasSale == true
              ? previewVariant!.price
              : (_product.maxPrice > _product.minPrice ? _product.maxPrice : null);
            final previewStock = previewVariant?.stockQuantity ?? 0;
            final stock = variant?.stockQuantity ?? 0;
            final canSubmit = variant != null && stock > 0;

            if (stock > 0 && tempQty > stock) {
              tempQty = stock;
            }
            if (tempQty < 1) tempQty = 1;

            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Center(
                      child: SizedBox(
                        width: 42,
                        child: Divider(thickness: 4, color: Color(0xFFD9D9D9)),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      isBuyNow ? 'Chọn phân loại để mua ngay' : 'Chọn phân loại trước khi thêm giỏ',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Colors.grey.shade200),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 118,
                            height: 118,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                              color: Colors.grey.shade100,
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                previewImageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => const Icon(
                                  Icons.image_not_supported_outlined,
                                  size: 26,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  alignment: Alignment.centerLeft,
                                  child: _buildPriceRow(
                                    price: previewDisplayPrice,
                                    originalPrice: previewOriginalPrice,
                                    priceFontSize: 42,
                                    originalFontSize: 16,
                                    spacing: 8,
                                    priceWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: _promoTagBg,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: _promoTagBorder),
                                  ),
                                  child: const Text(
                                    'Giá tốt hôm nay',
                                    style: TextStyle(
                                      color: AppColors.primary,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  'Kho: $previewStock',
                                  style: TextStyle(
                                    color: Colors.grey[700],
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    ..._product.attributes.map((attribute) {
                      final values = _valuesForAttribute(attribute.attributeId);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              attribute.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppColors.secondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: values.map((value) {
                                final selected = tempSelected[attribute.attributeId] == value.valueId;
                                return InkWell(
                                  onTap: () {
                                    setModalState(() {
                                      tempSelected[attribute.attributeId] = value.valueId;
                                    });
                                  },
                                  borderRadius: BorderRadius.circular(8),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: selected ? AppColors.primary : Colors.grey.shade300,
                                      ),
                                      color: selected ? const Color(0xFFFFF1F1) : Colors.white,
                                    ),
                                    child: Text(
                                      value.value,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                                        color: selected ? AppColors.primary : AppColors.secondary,
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      );
                    }),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          variant == null ? 'Vui lòng chọn đủ phân loại' : 'Kho: $stock sản phẩm',
                          style: TextStyle(
                            fontSize: 13,
                            color: (variant != null && stock == 0) ? Colors.redAccent : Colors.grey[700],
                          ),
                        ),
                        Row(
                          children: [
                            _qtyButton(Icons.remove, () {
                              setModalState(() {
                                if (tempQty > 1) tempQty--;
                              });
                            }),
                            SizedBox(
                              width: 48,
                              child: Center(
                                child: Text(
                                  '$tempQty',
                                  style: const TextStyle(fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                            _qtyButton(Icons.add, () {
                              setModalState(() {
                                final max = stock <= 0 ? 1 : stock;
                                if (tempQty < max) tempQty++;
                              });
                            }),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: canSubmit
                            ? () {
                                setState(() {
                                  _selectedOptions
                                    ..clear()
                                    ..addAll(tempSelected);
                                  _quantity = tempQty;
                                });
                                Navigator.pop(context);
                                ScaffoldMessenger.of(this.context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      isBuyNow ? 'Mua ngay (mock).' : 'Đã thêm vào giỏ hàng (mock).',
                                    ),
                                  ),
                                );
                              }
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          minimumSize: const Size.fromHeight(48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: Text(isBuyNow ? 'Xác nhận mua ngay' : 'Xác nhận thêm giỏ'),
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

class _HighlightItem extends StatelessWidget {
  final IconData icon;
  final String title;

  const _HighlightItem({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: AppColors.secondary, size: 20),
          const SizedBox(height: 6),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

class _MockReview {
  final String author;
  final int rating;
  final String content;
  final String createdAt;

  const _MockReview({
    required this.author,
    required this.rating,
    required this.content,
    required this.createdAt,
  });
}

class _MockRelatedProduct {
  final String slug;
  final String name;
  final double price;
  final String imageUrl;

  const _MockRelatedProduct({
    required this.slug,
    required this.name,
    required this.price,
    required this.imageUrl,
  });
}
