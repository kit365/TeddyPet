import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';

class StoryStatsSection extends StatelessWidget {
  const StoryStatsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFFFFF3E2),
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "CÂU CHUYỆN CỦA CHÚNG TÔI",
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),

          const Text(
            "Chăm sóc thú cưng với\ntất cả tình yêu thương",
            style: TextStyle(
              color: AppColors.secondary,
              fontSize: 28,
              fontWeight: FontWeight.w900,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 18),

          const Text(
            "Với nhiều năm kinh nghiệm và tình yêu dành cho động vật, chúng tôi cam kết mang đến dịch vụ chăm sóc thú cưng tốt nhất. Từ việc cung cấp sản phẩm chất lượng cao đến các dịch vụ chuyên nghiệp, chúng tôi luôn đặt sức khỏe và hạnh phúc của thú cưng lên hàng đầu.",
            style: TextStyle(
              color: Color(0xFF4A4A4A),
              fontSize: 13,
              height: 1.6,
            ),
          ),

          const SizedBox(height: 30),
          _buildFeatureItem("Dịch vụ chăm sóc thú cưng cao cấp và chuyên nghiệp"),
          _buildFeatureItem("Chăm sóc tận tâm với tình yêu thương dành cho thú cưng"),
          _buildFeatureItem("Mang lại hạnh phúc qua việc chăm sóc đúng cách"),

          const SizedBox(height: 32),

          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF6262), Color(0xFFFF9466)],
              ),
              borderRadius: BorderRadius.circular(30),
            ),
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                foregroundColor: Colors.white,
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.symmetric(horizontal: 35, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: const Text("Đặt lịch ngay", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),

          const SizedBox(height: 50),

          // PHẦN TRÌNH DIỄN HÌNH ẢNH (2 ảnh chồng nhau và badge xoay)
          SizedBox(
            height: 350,
            child: Stack(
              children: [


                Positioned(
                  left: 0,
                  top: 0,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: Image.network(
                        'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/h1-filler-counter-img-1.jpg',
                        width: 200,
                        height: 300,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),


                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 25)
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: Image.network(
                        'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/h1-filler-counter-img-2.jpg',
                        width: 190,
                        height: 260,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),

                Center(
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Color(0xFFFFF3E2), shape: BoxShape.circle),
                    child: Image.network(
                      'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/rotate-img-01.png',
                      width: 90,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 60),

          // BẢNG SỐ LIỆU THỐNG KÊ (Counter)
          _buildStatGrid(),
        ],
      ),
    );
  }

  // --- WIDGET CON CHO CÁC DÒNG ĐẶC ĐIỂM (CÓ NỀN TRẮNG) ---
  Widget _buildFeatureItem(String text) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(40),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: AppColors.secondary,
              ),
            ),
          ),
          const SizedBox(width: 10),

          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.add_rounded, color: Colors.white, size: 14),
          ),
        ],
      ),
    );
  }

  // --- WIDGET CON CHO BẢNG SỐ LIỆU ---
  Widget _buildStatGrid() {
    final stats = [
      {"count": "240+", "label": "ĐÃ BÁN"},
      {"count": "35+", "label": "THÀNH VIÊN"},
      {"count": "10K+", "label": "HÀI LÒNG"},
      {"count": "99+", "label": "SẢN PHẨM"},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 25,
        crossAxisSpacing: 25,
        childAspectRatio: 1.6,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) {
        return Column(
          children: [
            Text(
              stats[index]['count']!,
              style: const TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.w900,
                color: AppColors.secondary,
                height: 1.0,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              stats[index]['label']!,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Color(0xFF6B7280),
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 12),
            Container(width: 40, height: 2.5, color: AppColors.primary),
          ],
        );
      },
    );
  }
}
