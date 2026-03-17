import 'package:teddypet_mobile/data/models/entities/product/product_entity.dart';

class ProductSectionModel {
  final String title;
  final List<ProductEntity> products;

  ProductSectionModel({
    required this.title,
    required this.products,
  });
}
