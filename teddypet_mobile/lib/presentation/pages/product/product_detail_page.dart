import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:intl/intl.dart';
import 'package:teddypet_mobile/data/models/entities/feedback/feedback_entity.dart';
import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/product/product_detail_provider.dart';
import '../../providers/cart/cart_provider.dart';
import '../../providers/auth/auth_provider.dart';
import '../../../../data/models/response/product/product_detail_response.dart';
import 'models/product_reviews_arguments.dart';

class ProductDetailPage extends StatefulWidget {
  final String? slug;
  final int? productId;

  const ProductDetailPage({super.key, this.slug, this.productId});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  static const Color _mutedPriceColor = Color(0xFF9B9B9B);
  static const Color _promoTagBg = Color(0xFFFFF1F1);
  static const Color _promoTagBorder = Color(0xFFFFD6D6);

  final PageController _imageController = PageController();
  int _currentImageIndex = 0;
  int _quantity = 1;
  bool _isFavorite = false;
  final Map<int, int> _selectedOptions = {}; // attributeId -> valueId

  // Removed _MockReview and _MockRelatedProduct as real models are now used.

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.slug != null) {
        context.read<ProductDetailProvider>().fetchProductDetail(widget.slug!);
      } else if (widget.productId != null) {
        context.read<ProductDetailProvider>().fetchProductDetailById(widget.productId!);
      }
    });
  }

  @override
  void dispose() {
    _imageController.dispose();
    super.dispose();
  }

  ProductVariantResponse? _selectedVariant(ProductDetailResponse product) {
    final effectiveAttributes = _getEffectiveAttributes(product);
    if (effectiveAttributes.isEmpty) {
      return product.variants.isNotEmpty ? product.variants.first : null;
    }

    final selectedAll = effectiveAttributes.every(
      (a) => _selectedOptions[a.attributeId] != null,
    );

    if (!selectedAll) return null;

    try {
      return product.variants.firstWhere((variant) {
        return effectiveAttributes.every((attr) {
          final selectedValueId = _selectedOptions[attr.attributeId];
          return variant.attributes.any((vAttr) => 
            vAttr.attributeId == attr.attributeId && vAttr.valueId == selectedValueId
          );
        });
      });
    } catch (_) {
      return null;
    }
  }

  ProductVariantResponse? _findVariantBySelection(ProductDetailResponse product, Map<int, int> selectedOptions) {
    final effectiveAttributes = _getEffectiveAttributes(product);
    if (effectiveAttributes.isEmpty) {
      return product.variants.isNotEmpty ? product.variants.first : null;
    }

    final selectedAll = effectiveAttributes.every(
      (a) => selectedOptions[a.attributeId] != null,
    );

    if (!selectedAll) return null;

    try {
      return product.variants.firstWhere((variant) {
        return effectiveAttributes.every((attr) {
          final selectedValueId = selectedOptions[attr.attributeId];
          return variant.attributes.any((vAttr) => 
            vAttr.attributeId == attr.attributeId && vAttr.valueId == selectedValueId
          );
        });
      });
    } catch (_) {
      return null;
    }
  }

  ProductVariantResponse? _findPreviewVariantByPartialSelection(ProductDetailResponse product, Map<int, int> selectedOptions) {
    if (product.variants.isEmpty) return null;
    if (selectedOptions.isEmpty) return product.variants.first;

    for (final variant in product.variants) {
      final matchedAllSelected = selectedOptions.entries.every((entry) {
        return variant.attributes.any(
          (attr) => attr.attributeId == entry.key && attr.valueId == entry.value,
        );
      });
      if (matchedAllSelected) return variant;
    }

    return product.variants.first;
  }

  String _formatCurrency(double value) {
    final text = value.toStringAsFixed(0);
    final reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    return text.replaceAllMapped(reg, (m) => '${m[1]}.') + 'đ';
  }

  String _getServerUrl() {
    final apiUrl = dotenv.get('API_URL', fallback: 'http://localhost:8080/api/');
    return apiUrl.replaceAll('/api/', '/');
  }

  String _getNormalizedImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/400x400';
    if (url.startsWith('http')) return url;
    final serverUrl = _getServerUrl();
    final path = url.startsWith('/') ? url.substring(1) : url;
    return '$serverUrl$path';
  }

  List<ProductAttributeResponse> _getEffectiveAttributes(ProductDetailResponse product) {
    if (product.attributes.isNotEmpty) return product.attributes;
    if (product.variants.isEmpty) return [];

    final map = <int, String>{};
    for (final v in product.variants) {
      for (final attr in v.attributes) {
        map[attr.attributeId] = attr.attributeName;
      }
    }
    return map.entries
        .map((e) => ProductAttributeResponse(
              attributeId: e.key,
              name: e.value,
              valueIds: [],
            ))
        .toList();
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

  Widget _buildAttributesSection(ProductDetailResponse product) {
    final attributesToShow = _getEffectiveAttributes(product);
    if (attributesToShow.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      color: Colors.white,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Phân loại',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.secondary,
            ),
          ),
          const SizedBox(height: 18),
          ...attributesToShow.map((attr) {
            final values = _valuesForAttribute(product, attr.attributeId);
            if (values.isEmpty) return const SizedBox.shrink();

            return Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        attr.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.secondary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (_selectedOptions[attr.attributeId] != null)
                        Text(
                          ': ${values.firstWhere((v) => v.valueId == _selectedOptions[attr.attributeId]).value}',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: values.map((v) {
                      final isSelected = _selectedOptions[attr.attributeId] == v.valueId;
                      return InkWell(
                        onTap: () {
                          setState(() {
                            _selectedOptions[attr.attributeId] = v.valueId;
                          });
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : Colors.grey.shade300,
                              width: isSelected ? 1.5 : 1,
                            ),
                            color: isSelected ? const Color(0xFFFFF1F1) : Colors.white,
                          ),
                          child: Text(
                            v.value,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              color: isSelected ? AppColors.primary : AppColors.secondary,
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
        ],
      ),
    );
  }

  List<ProductAttributeValueResponse> _valuesForAttribute(ProductDetailResponse product, int attributeId) {
    final map = <int, ProductAttributeValueResponse>{};
    for (final v in product.variants) {
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
    return Consumer<ProductDetailProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
          );
        }

        if (provider.error != null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Lỗi')),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(provider.error!, style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      if (widget.slug != null) {
                        provider.fetchProductDetail(widget.slug!);
                      }
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            ),
          );
        }

        final product = provider.product;
        if (product == null) {
          return const Scaffold(
            body: Center(child: Text('Không tìm thấy sản phẩm')),
          );
        }

        final variant = _selectedVariant(product);
        final displayPrice = variant?.displayPrice ?? product.minPrice;
        final originalPrice = variant?.hasSale == true
            ? variant!.price
            : (product.maxPrice > product.minPrice ? product.maxPrice : null);
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
                _buildImageSection(product),
                _buildInfoSection(product, displayPrice, originalPrice),
                _buildAttributesSection(product),
                _buildQuantitySection(stock),
                _buildHighlightsSection(),
                _buildDescriptionSection(product),
                _buildReviewSection(product, provider.feedbacks),
                _buildRelatedSection(provider.relatedProducts),
                const SizedBox(height: 120),
              ],
            ),
          ),
          bottomNavigationBar: _buildBottomBar(product, stock),
        );
      },
    );
  }

  Widget _buildImageSection(ProductDetailResponse product) {
    final images = product.images;

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
                    : _getNormalizedImageUrl(images[index].imageUrl);
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

  Widget _buildInfoSection(ProductDetailResponse product, double displayPrice, double? originalPrice) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            product.name,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.star, size: 18, color: Colors.amber),
              const SizedBox(width: 4),
              Text(
                product.averageRating.toStringAsFixed(1),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 8),
              Text(
                '(${product.ratingCount} đánh giá)',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const SizedBox(width: 8),
              Text(
                '• Đã bán ${product.soldCount}',
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
          _buildPriceTags(product),
        ],
      ),
    );
  }

  Widget _buildPriceTags(ProductDetailResponse product) {
    final tagNames = product.tags
        .map((e) => (e is Map<String, dynamic>) ? (e['name']?.toString() ?? '') : e.toString())
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

  Widget _buildDescriptionSection(ProductDetailResponse product) {
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
            product.description,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[800],
              height: 1.45,
            ),
          ),
          if (product.origin.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('Xuất xứ: ${product.origin}', style: const TextStyle(fontSize: 13)),
          ],
          if (product.material.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text('Chất liệu/Thành phần: ${product.material}', style: const TextStyle(fontSize: 13)),
          ],
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

  Widget _buildReviewSection(ProductDetailResponse product, List<FeedbackEntity> feedbacks) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () => _openReviewsPage(product),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Text(
                    product.averageRating.toStringAsFixed(1),
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
                      'Đánh Giá Sản Phẩm (${product.ratingCount})',
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
          if (feedbacks.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(child: Text('Chưa có đánh giá nào cho sản phẩm này.')),
            )
          else
            ...feedbacks.take(3).map(
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
                                (review.userName).substring(0, 1).toUpperCase(),
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
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                              ),
                            ),
                            Text(
                              DateFormat('dd/MM/yyyy').format(review.createdAt),
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
                          review.comment,
                          style: TextStyle(color: Colors.grey[800], fontSize: 14, height: 1.45),
                        ),
                        if (review.replyComment != null) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.grey[200],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Phản hồi từ shop:',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  review.replyComment!,
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
          if (feedbacks.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => _openReviewsPage(product),
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

  void _openReviewsPage(ProductDetailResponse product) {
    Navigator.pushNamed(
      context,
      AppRoutes.productReviews,
      arguments: ProductReviewsArguments(
        productId: product.id,
        productName: product.name,
        rating: product.averageRating,
        totalReviews: product.ratingCount,
      ),
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

  Widget _buildRelatedSection(List<ProductEntity> relatedProducts) {
    if (relatedProducts.isEmpty) return const SizedBox.shrink();

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
            height: 190,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: relatedProducts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final item = relatedProducts[index];
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
                    width: 150,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                          child: Image.network(
                            _getNormalizedImageUrl(item.firstImage),
                            height: 100,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              height: 100,
                              color: Colors.grey[100],
                              child: const Center(child: Icon(Icons.image_not_supported, color: Colors.grey)),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.2),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _formatCurrency(item.minPrice),
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
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

  Widget _buildBottomBar(ProductDetailResponse product, int stock) {
    final effectiveAttributes = _getEffectiveAttributes(product);
    final canBuy = effectiveAttributes.isEmpty ? stock > 0 : true;

    return Container(
      padding: const EdgeInsets.all(12),
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
                      _onTapAction(product: product, isBuyNow: false);
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
                      _onTapAction(product: product, isBuyNow: true);
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

  void _onTapAction({required ProductDetailResponse product, required bool isBuyNow}) async {
    final variant = _selectedVariant(product);
    final effectiveAttributes = _getEffectiveAttributes(product);
    if (effectiveAttributes.isNotEmpty && variant == null) {
      _showVariantPickerSheet(product: product, isBuyNow: isBuyNow);
      return;
    }

    final stock = variant?.stockQuantity ?? 0;
    if (stock <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sản phẩm đã hết hàng.')),
      );
      return;
    }

    final variantId = variant?.variantId ?? 0;
    if (variantId == 0) return;

    final authProvider = context.read<AuthProvider>();
    if (authProvider.token == null) {
      _showLoginPrompt();
      return;
    }

    final cartProvider = context.read<CartProvider>();
    final success = await cartProvider.addToCart(variantId, _quantity);

    if (success) {
      if (isBuyNow) {
        Navigator.pushNamed(context, AppRoutes.cart);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã thêm sản phẩm vào giỏ hàng!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không thể thêm vào giỏ hàng. Vui lòng thử lại.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showVariantPickerSheet({required ProductDetailResponse product, required bool isBuyNow}) {
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
            final variant = _findVariantBySelection(product, tempSelected);
            // Nếu chưa chọn đủ phân loại (variant == null), để giá là 0 theo yêu cầu của user
            final previewDisplayPrice = variant?.displayPrice ?? 0;
            final previewOriginalPrice = (variant != null && variant.hasSale) ? variant.price : null;
            
            final previewVariant = variant ?? _findPreviewVariantByPartialSelection(product, tempSelected);
            final previewImageUrl = previewVariant?.featuredImageUrl ??
              (product.images.isNotEmpty ? product.images.first.imageUrl : 'https://placehold.co/300x300');
            final previewStock = variant?.stockQuantity ?? (previewVariant?.stockQuantity ?? 0);
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
                                    priceFontSize: 28,
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
                    ..._getEffectiveAttributes(product).map((attribute) {
                      final values = _valuesForAttribute(product, attribute.attributeId);
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
                              ? () async {
                                  setState(() {
                                    _selectedOptions
                                      ..clear()
                                      ..addAll(tempSelected);
                                    _quantity = tempQty;
                                  });
                                    Navigator.pop(context);
                                    
                                    final authProvider = this.context.read<AuthProvider>();
                                    if (authProvider.token == null) {
                                      _showLoginPrompt();
                                      return;
                                    }

                                    final cartProvider = this.context.read<CartProvider>();
                                    final success = await cartProvider.addToCart(variant!.variantId, tempQty);
                                  
                                  if (success) {
                                    if (isBuyNow) {
                                      Navigator.pushNamed(this.context, AppRoutes.cart);
                                    } else {
                                      ScaffoldMessenger.of(this.context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Đã thêm sản phẩm vào giỏ hàng!'),
                                          backgroundColor: Colors.green,
                                        ),
                                      );
                                    }
                                  } else {
                                    ScaffoldMessenger.of(this.context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Lỗi khi thêm vào giỏ hàng.'),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
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

  void _showLoginPrompt() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Yêu cầu đăng nhập'),
        content: const Text('Vui lòng đăng nhập để thực hiện chức năng này.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Để sau'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, AppRoutes.login);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Đăng nhập', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
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

// Custom Review and Related Product classes are no longer needed as we use real models.
