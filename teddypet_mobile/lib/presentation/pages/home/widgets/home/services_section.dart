import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';

class ServicesSection extends StatelessWidget {
  const ServicesSection({super.key});

  @override
  Widget build(BuildContext context) {
    final services = [
      {
        "image": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/service-png-img-alt-04.png",
        "title": "Đồ dùng thú cưng",
        "desc": "Sản phẩm chăm sóc và phụ kiện chất lượng cao.",
      },
      {
        "image": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/service-png-img-alt-08.png",
        "title": "Vui chơi",
        "desc": "Hoạt động giúp thú cưng khỏe mạnh và năng động.",
      },
      {
        "image": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/service-png-img-alt-07.png",
        "title": "Nhà thú cưng",
        "desc": "Không gian sống an toàn và thoải mái nhất.",
      },
      {
        "image": "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/service-png-img-alt-05.png",
        "title": "Yêu thương",
        "desc": "Đồng hành tìm kiếm thú cưng phù hợp nhất.",
      }
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 60),
      color: Colors.white,
      child: Column(
        children: [
          // Header của Section
          const Text(
            "PHỤC VỤ NHU CẦU THÚ CƯNG",
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            "Khám phá dịch vụ",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.secondary,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            "Mang đến các dịch vụ chăm sóc, huấn luyện và vui chơi chu đáo nhất.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 40),

          // Grid Dịch vụ (2 cột)
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 15,
              mainAxisSpacing: 15,
              childAspectRatio: 0.75,
            ),
            itemCount: services.length,
            itemBuilder: (context, index) {
              return Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7F2), // Màu hồng nhạt
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.network(
                      services[index]['image']!,
                      height: 80,
                      fit: BoxFit.contain,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      services[index]['title']!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.secondary,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      services[index]['desc']!,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.grey, fontSize: 10),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
