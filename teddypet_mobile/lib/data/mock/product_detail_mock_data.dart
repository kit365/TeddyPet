import '../models/response/product/product_detail_response.dart';

class ProductDetailMockData {
  static ProductDetailResponse bySlug(String? slug) {
    final normalized = (slug ?? 'hat-an-cho-cho-truong-thanh').toLowerCase();

    final data = _all.firstWhere(
      (e) => (e['slug'] as String).toLowerCase() == normalized,
      orElse: () => _all.first,
    );

    return ProductDetailResponse.fromJson(data);
  }

  static final List<Map<String, dynamic>> _all = [
    {
      'id': 101,
      'slug': 'hat-an-cho-cho-truong-thanh',
      'name': 'Hạt ăn cho chó trưởng thành TeddyPet Premium',
      'description':
          'Dòng hạt cao cấp giàu đạm động vật, hỗ trợ tiêu hóa và làm đẹp lông. Công thức cân bằng vitamin & khoáng chất cho chó trưởng thành.',
      'metaTitle': 'Hạt ăn cho chó trưởng thành TeddyPet Premium',
      'metaDescription': 'Thức ăn hạt cao cấp cho chó trưởng thành',
      'minPrice': 129000,
      'maxPrice': 249000,
      'origin': 'Việt Nam',
      'material': 'Thịt gà, ngũ cốc, dầu cá',
      'viewCount': 1289,
      'soldCount': 356,
      'ratingCount': 214,
      'averageRating': 4.7,
      'status': 'ACTIVE',
      'productType': 'VARIABLE',
      'categories': [
        {'id': 1, 'name': 'Thức ăn cho chó', 'slug': 'thuc-an-cho-cho'}
      ],
      'tags': [
        {'id': 1, 'name': 'Bán chạy', 'slug': 'ban-chay'},
        {'id': 2, 'name': 'Giảm giá', 'slug': 'sale'}
      ],
      'attributes': [
        {'attributeId': 1, 'name': 'Khối lượng', 'valueIds': [11, 12]},
        {'attributeId': 2, 'name': 'Hương vị', 'valueIds': [21, 22]}
      ],
      'variants': [
        {
          'variantId': 1001,
          'productId': 101,
          'name': '500g - Gà nướng',
          'price': 149000,
          'salePrice': 129000,
          'stockQuantity': 25,
          'unit': 'gói',
          'featuredImageUrl': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
          'sku': 'TP-DOG-500-CHICKEN',
          'status': 'ACTIVE',
          'attributes': [
            {
              'valueId': 11,
              'attributeId': 1,
              'attributeName': 'Khối lượng',
              'value': '500g',
              'displayOrder': 1,
              'displayCode': '500g'
            },
            {
              'valueId': 21,
              'attributeId': 2,
              'attributeName': 'Hương vị',
              'value': 'Gà nướng',
              'displayOrder': 1,
              'displayCode': 'GA'
            }
          ]
        },
        {
          'variantId': 1002,
          'productId': 101,
          'name': '1kg - Gà nướng',
          'price': 269000,
          'salePrice': 229000,
          'stockQuantity': 18,
          'unit': 'gói',
          'featuredImageUrl': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
          'sku': 'TP-DOG-1000-CHICKEN',
          'status': 'ACTIVE',
          'attributes': [
            {
              'valueId': 12,
              'attributeId': 1,
              'attributeName': 'Khối lượng',
              'value': '1kg',
              'displayOrder': 2,
              'displayCode': '1kg'
            },
            {
              'valueId': 21,
              'attributeId': 2,
              'attributeName': 'Hương vị',
              'value': 'Gà nướng',
              'displayOrder': 1,
              'displayCode': 'GA'
            }
          ]
        },
        {
          'variantId': 1003,
          'productId': 101,
          'name': '500g - Bò hầm',
          'price': 159000,
          'salePrice': null,
          'stockQuantity': 0,
          'unit': 'gói',
          'featuredImageUrl': 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800',
          'sku': 'TP-DOG-500-BEEF',
          'status': 'ACTIVE',
          'attributes': [
            {
              'valueId': 11,
              'attributeId': 1,
              'attributeName': 'Khối lượng',
              'value': '500g',
              'displayOrder': 1,
              'displayCode': '500g'
            },
            {
              'valueId': 22,
              'attributeId': 2,
              'attributeName': 'Hương vị',
              'value': 'Bò hầm',
              'displayOrder': 2,
              'displayCode': 'BO'
            }
          ]
        }
      ],
      'images': [
        {'id': 1, 'imageUrl': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=1200'},
        {'id': 2, 'imageUrl': 'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=1200'},
        {'id': 3, 'imageUrl': 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=1200'}
      ]
    }
  ];
}
