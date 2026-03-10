import 'package:flutter/material.dart';

class HeroSection extends StatelessWidget {
  const HeroSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      // 1. Phông nền Gradient
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFF6262), Color(0xFFFF9466)],
        ),
      ),
      child: Stack(
        clipBehavior: Clip.none, // Cho phép các thành phần tràn ra ngoài nếu cần
        children: [

          // --- LỚP 1: CÁI "BLOB" (Hình tròn trang trí mờ mờ phía sau) ---
          Positioned(
            right: -40,
            top: 20,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.1),
              ),
            ),
          ),

          // --- LỚP 2: NỘI DUNG CHỮ ---
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 50, 20, 30),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "KẾT NỐI YÊU THƯƠNG CÙNG THÚ CƯNG",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  "Khởi đầu hành trình\ncủa mỗi thú cưng\nvới tình yêu thương.",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 16),
                const SizedBox(
                  width: 200,
                  child: Text(
                    "Trải nghiệm những khoảnh khắc đáng nhớ cùng thú cưng của bạn. Chăm sóc và niềm vui trọn vẹn.",
                    style: TextStyle(color: Colors.white, fontSize: 13, height: 1.5),
                  ),
                ),
                const SizedBox(height: 25),

                // NÚT XEM THÊM CHUẨN WEB
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF102937),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                  ),
                  child: const Text("Xem thêm", style: TextStyle(fontWeight: FontWeight.bold)),
                ),

                const SizedBox(height: 200),
              ],
            ),
          ),

          Positioned(
            bottom: 0,
            right: -20,
            child: Image.network(
              'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/h1-slider-imgs.png',
              height: 300,
              fit: BoxFit.contain,
              alignment: Alignment.bottomRight,
            ),
          ),

        ],
      ),
    );
  }
}
