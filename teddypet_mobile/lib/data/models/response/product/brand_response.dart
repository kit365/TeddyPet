class BrandResponse {
  final int id;
  final String name;
  final String? imageUrl;
  final String? description;

  BrandResponse({
    required this.id,
    required this.name,
    this.imageUrl,
    this.description,
  });

  factory BrandResponse.fromJson(Map<String, dynamic> json) {
    return BrandResponse(
      id: json['brandId'] ?? 0,
      name: json['name'] ?? '',
      imageUrl: json['imageUrl'],
      description: json['description'],
    );
  }
}
