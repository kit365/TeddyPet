import 'package:flutter/material.dart';
import '../../../core/routes/app_routes.dart';

class AccountSettingsPage extends StatelessWidget {
  const AccountSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thiết lập tài khoản'),
        centerTitle: true,
      ),
      body: ListView(
        children: [
          _buildMenuItem(
            context,
            icon: Icons.person_outline,
            title: 'Chỉnh sửa hồ sơ',
            onTap: () => Navigator.pushNamed(context, AppRoutes.editProfile),
          ),
          _buildMenuItem(
            context,
            icon: Icons.lock_outline,
            title: 'Đổi mật khẩu',
            onTap: () => Navigator.pushNamed(context, AppRoutes.changePassword),
          ),
          const Divider(height: 1),
          _buildMenuItem(
            context,
            icon: Icons.info_outline,
            title: 'Về ứng dụng',
            onTap: () => _showAboutDialog(context),
          ),
          _buildMenuItem(
            context,
            icon: Icons.description_outlined,
            title: 'Điều khoản sử dụng',
            onTap: () => _showTermsDialog(context),
          ),
          _buildMenuItem(
            context,
            icon: Icons.privacy_tip_outlined,
            title: 'Chính sách bảo mật',
            onTap: () => _showPrivacyDialog(context),
          ),
          const Divider(height: 1),
          _buildMenuItem(
            context,
            icon: Icons.delete_outline,
            title: 'Xóa tài khoản',
            titleColor: Colors.red,
            onTap: () => _showDeleteAccountDialog(context),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    Color? titleColor,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: titleColor ?? Theme.of(context).iconTheme.color),
      title: Text(title, style: TextStyle(color: titleColor)),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Về TeddyPet'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Phiên bản: 1.0.0'),
            SizedBox(height: 8),
            Text('TeddyPet - Ứng dụng mua sắm cho thú cưng'),
            SizedBox(height: 8),
            Text('© 2024 TeddyPet. All rights reserved.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showTermsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Điều khoản sử dụng'),
        content: const SingleChildScrollView(
          child: Text(
            'Bằng việc sử dụng ứng dụng TeddyPet, bạn đồng ý với các điều khoản sau:\n\n'
            '1. Tuân thủ pháp luật Việt Nam\n'
            '2. Không sử dụng cho mục đích bất hợp pháp\n'
            '3. Bảo vệ thông tin tài khoản\n'
            '4. Chịu trách nhiệm về nội dung đăng tải',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showPrivacyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chính sách bảo mật'),
        content: const SingleChildScrollView(
          child: Text(
            'TeddyPet cam kết bảo vệ quyền riêng tư của bạn:\n\n'
            '• Thu thập thông tin cần thiết\n'
            '• Không chia sẻ với bên thứ ba\n'
            '• Bảo mật dữ liệu người dùng\n'
            '• Quyền xóa dữ liệu cá nhân',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa tài khoản'),
        content: const Text(
          'Bạn có chắc chắn muốn xóa tài khoản?\n\n'
          'Hành động này không thể hoàn tác và tất cả dữ liệu sẽ bị xóa vĩnh viễn.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Tính năng đang phát triển')),
              );
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }
}
