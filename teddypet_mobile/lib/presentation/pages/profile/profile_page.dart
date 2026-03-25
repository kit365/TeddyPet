import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/core/theme/app_colors.dart';
import 'package:teddypet_mobile/presentation/providers/auth/auth_provider.dart';
import 'package:teddypet_mobile/core/routes/app_routes.dart';
import 'package:teddypet_mobile/presentation/common/widgets/primary_button.dart';
import 'package:teddypet_mobile/presentation/providers/user/user_provider.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.token != null) {
        context.read<UserProvider>().getProfile();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final userProvider = context.watch<UserProvider>();
    final isLoggedIn = authProvider.token != null;
    final user = userProvider.userProfile;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Tài khoản của tôi',
          style: TextStyle(color: Color(0xFF2C3E50), fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: (authProvider.isLoading || userProvider.isLoading) && user == null
          ? const Center(child: CircularProgressIndicator(color: AppColors.secondary))
          : RefreshIndicator(
              onRefresh: () async {
                if (isLoggedIn) await context.read<UserProvider>().getProfile();
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    // ===== IF ELSE HEADER =====
                    if (isLoggedIn)
                      _buildLoggedInHeader(user, authProvider)
                    else
                      _buildGuestHeader(),

                    // Menu Items (Chung)
                    _buildMenuItem(Icons.shopping_bag_outlined, 'Đơn mua', () {
                      if (!isLoggedIn) {
                        _showLoginRequired();
                      } else {
                        Navigator.pushNamed(context, AppRoutes.myPurchases);
                      }
                    }),
                    const Divider(height: 1, indent: 60, endIndent: 20, color: Color(0xFFF1F1F1)),
                    _buildMenuItem(Icons.calendar_month_outlined, 'Lịch sử đặt lịch', () {
                      if (!isLoggedIn) {
                        _showLoginRequired();
                      } else {
                        Navigator.pushNamed(context, AppRoutes.bookingHistory);
                      }
                    }),
                    const Divider(height: 1, indent: 60, endIndent: 20, color: Color(0xFFF1F1F1)),
                    _buildMenuItem(Icons.add_shopping_cart_outlined, 'Đặt lịch mới', () {
                      if (!isLoggedIn) {
                        _showLoginRequired();
                      } else {
                        Navigator.pushNamed(context, AppRoutes.bookingWizard);
                      }
                    }),
                    const Divider(height: 1, indent: 60, endIndent: 20, color: Color(0xFFF1F1F1)),
                    _buildMenuItem(Icons.favorite_border_rounded, 'Yêu thích', () {
                      if (!isLoggedIn) _showLoginRequired();
                    }),
                    const Divider(height: 1, indent: 60, endIndent: 20, color: Color(0xFFF1F1F1)),
                    _buildMenuItem(Icons.location_on_outlined, 'Địa chỉ nhận hàng', () {
                      if (!isLoggedIn) {
                        _showLoginRequired();
                      } else {
                        Navigator.pushNamed(context, AppRoutes.addressList);
                      }
                    }),
                    const Divider(height: 1, indent: 60, endIndent: 20, color: Color(0xFFF1F1F1)),
                    _buildMenuItem(Icons.help_outline_rounded, 'Trung tâm hỗ trợ', () {}),
                    const Divider(height: 1, indent: 60, endIndent: 20, color: Color(0xFFF1F1F1)),
                    _buildMenuItem(Icons.settings_outlined, 'Thiết lập tài khoản', () {
                      if (!isLoggedIn) {
                        _showLoginRequired();
                      } else {
                        Navigator.pushNamed(context, AppRoutes.accountSettings);
                      }
                    }),

                    const SizedBox(height: 30),

                    // Logout Button (Chỉ hiện khi đã Login)
                    if (isLoggedIn)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: OutlinedButton(
                            onPressed: () async {
                              await authProvider.logout();
                              if (context.mounted) {
                                Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (route) => false);
                              }
                            },
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.redAccent),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('ĐĂNG XUẤT',
                                style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ),
                    const SizedBox(height: 50),
                  ],
                ),
              ),
            ),
    );
  }

  // Header cho khách (Guest)
  Widget _buildGuestHeader() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      width: double.infinity,
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: Colors.grey[200],
            child: const Icon(Icons.person_outline_rounded, size: 45, color: Colors.grey),
          ),
          const SizedBox(height: 20),
          const Text(
            'Chào mừng bạn đến với TeddyPet!',
            style: TextStyle(fontSize: 16, color: Color(0xFF2C3E50)),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 140,
                child: PrimaryButton(
                  text: 'ĐĂNG NHẬP',
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.login),
                ),
              ),
              const SizedBox(width: 15),
              SizedBox(
                width: 140,
                child: OutlinedButton(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.register),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 48),
                    side: const BorderSide(color: AppColors.secondary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('ĐĂNG KÝ',
                      style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  // Header cho User đã Login
  Widget _buildLoggedInHeader(user, authProvider) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 20),
      child: Row(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: AppColors.secondary.withOpacity(0.1),
            child: user?.avatarUrl != null
                ? ClipOval(child: Image.network(user!.avatarUrl!, fit: BoxFit.cover, width: 80, height: 80))
                : const Icon(Icons.person, size: 40, color: AppColors.secondary),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user != null ? '${user.firstName} ${user.lastName}' : 'Đang tải...',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF2C3E50)),
                ),
                const SizedBox(height: 5),
                Text(
                  user?.email ?? authProvider.registerEmail ?? 'Thành viên TeddyPet',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              Navigator.pushNamed(context, AppRoutes.editProfile);
            },
            icon: const Icon(Icons.edit_outlined, color: AppColors.secondary),
          )
        ],
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    return Container(
      color: Colors.white,
      child: ListTile(
        dense: true,
        leading: Icon(icon, color: AppColors.secondary, size: 22),
        title: Text(title, style: const TextStyle(fontSize: 15, color: Color(0xFF2C3E50))),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
      ),
    );
  }

  void _showLoginRequired() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Vui lòng đăng nhập để sử dụng tính năng này!')),
    );
  }
}
