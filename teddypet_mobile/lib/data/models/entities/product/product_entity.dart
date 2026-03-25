import '../../response/product/product_response.dart';

class ProductEntity {
  final int id;
  final String slug;
  final String name;
  final double minPrice;
  final double maxPrice;
  final String? brandName;
  final String? firstImage;

  ProductEntity({
    required this.id,
    required this.slug,
    required this.name,
    required this.minPrice,
    required this.maxPrice,
    this.brandName,
    this.firstImage,
  });

  factory ProductEntity.fromResponse(ProductResponse response) {
    return ProductEntity(
      id: response.productId,
      slug: response.slug,
      name: response.name,
      minPrice: response.minPrice,
      maxPrice: response.maxPrice,
      brandName: response.brandName,
      firstImage: response.firstImage,
    );
  }
}
