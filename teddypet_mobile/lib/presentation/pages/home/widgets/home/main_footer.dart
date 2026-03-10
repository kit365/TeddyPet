import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';

class MainFooter extends StatelessWidget {
  const MainFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFFFF0F0), // Màu nền tổng thể của footer
      child: Column(
        children: [
          // --- PHẦN 1: TRANG TRÍ ĐẦU FOOTER (Chó, Mèo và Social) ---
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 15),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Ảnh mèo bên trái
                Image.network(
                  'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/footer-cats-walking-300x203.png',
                  width: 70,
                ),
                
                // Cụm Social Icon ở giữa
                Row(
                  children: [
                    _buildSocialIcon(Icons.facebook),
                    const SizedBox(width: 8),
                    _buildSocialIcon(Icons.camera_alt),
                  ],
                ),

                Image.network(
                  'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/footer-dogs-walking-300x203.png',
                  width: 70,
                ),
              ],
            ),
          ),

          Image.network(
            'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/footer-1-img.png',
            width: double.infinity,
            fit: BoxFit.cover,
          ),

          // --- PHẦN 3: NỘI DUNG MENU (Xếp dọc) ---
          Padding(
            padding: const EdgeInsets.all(25),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionTitle("Nhận hỗ trợ"),
                const SizedBox(height: 15),
                _buildLinkText(Icons.home, "43 Số 51, Bình Thuận, Quận 7, HCM"),
                _buildLinkText(Icons.phone, "0987 654 321"),
                _buildLinkText(Icons.email, "contact@teddypet.id.vn"),
                _buildLinkText(Icons.language, "teddypet.id.vn"),

                const SizedBox(height: 35),
                _buildSectionTitle("Trợ giúp"),
                const SizedBox(height: 15),
                _buildLinkText(null, "Theo Dõi Đơn Hàng"),
                _buildLinkText(null, "Câu Hỏi Thường Gặp"),
                _buildLinkText(null, "Tài Khoản Của Tôi"),
                _buildLinkText(null, "Đơn Hàng Của Bạn"),

                const SizedBox(height: 35),
                _buildSectionTitle("Về Chúng Tôi"),
                const SizedBox(height: 15),
                _buildLinkText(null, "Tin Tức"),
                _buildLinkText(null, "Dịch Vụ"),
                _buildLinkText(null, "Câu Chuyện Của Chúng Tôi"),
                _buildLinkText(null, "Liên Hệ"),

                const SizedBox(height: 35),
                _buildSectionTitle("Nhận thông tin mới nhất"),
                const SizedBox(height: 10),
                const Text(
                  "Cập nhật tin tức sản phẩm, bí quyết chăm sóc và làm đẹp độc quyền dành cho thú cưng.",
                  style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.5),
                ),
                const SizedBox(height: 20),
                _buildEmailInput(),
              ],
            ),
          ),

          // --- PHẦN 4: BẢNG COPYRIGHT ---
          _buildCopyrightBar(),
        ],
      ),
    );
  }

  Widget _buildSocialIcon(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.grey.shade400),
      ),
      child: Icon(icon, size: 18, color: AppColors.secondary),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: AppColors.secondary,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildLinkText(IconData? icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          if (icon != null)
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: Icon(icon, size: 16, color: Colors.grey),
            ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmailInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(35),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                decoration: InputDecoration(
                  hintText: "Nhập Email của bạn",
                  border: InputBorder.none,
                  hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                ),
              ),
            ),
          ),
          Container(
            margin: const EdgeInsets.all(4),
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.secondary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                elevation: 0,
              ),
              child: const Text("Đăng ký", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCopyrightBar() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 25, horizontal: 20),
      decoration: const BoxDecoration(
        image: DecorationImage(
          image: NetworkImage('https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/h1-slider-bg-img.jpg'),
          fit: BoxFit.cover,
        ),
      ),
      child: Column(
        children: [
          const Text(
            "© 2025 teddypet | Design by TeddyPet Team",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Text("Privacy & Cookies", style: TextStyle(color: Colors.white70, fontSize: 10)),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Text("|", style: TextStyle(color: Colors.white30)),
              ),
              Text("Terms of services", style: TextStyle(color: Colors.white70, fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }
}
