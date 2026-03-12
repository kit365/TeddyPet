class CategoryResponse {
  final String id; // Chỗ này map với `categoryId` từ BE
  final String name;
  final String? imageUrl;
  final List<CategoryResponse>? items; // Map với `children` từ BE

  CategoryResponse({
    required this.id,
    required this.name,
    this.imageUrl,
    this.items,
  });

  factory CategoryResponse.fromJson(Map<String, dynamic> json) {
    return CategoryResponse(
      id: json['categoryId']?.toString() ?? '', // BE trả về categoryId thay vì id
      name: json['name'] ?? '',
      imageUrl: json['imageUrl'],
      items: json['children'] != null
          ? (json['children'] as List).map((i) => CategoryResponse.fromJson(i)).toList()
          : null,
    );
  }
}

