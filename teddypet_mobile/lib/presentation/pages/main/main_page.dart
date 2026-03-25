import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/core/theme/app_colors.dart';
import 'package:teddypet_mobile/presentation/pages/home/home_page.dart';
import 'package:teddypet_mobile/presentation/pages/category/category_page.dart';
import 'package:teddypet_mobile/presentation/pages/cart/cart_page.dart';
import 'package:teddypet_mobile/presentation/pages/profile/profile_page.dart';
import 'package:teddypet_mobile/presentation/pages/notification/notification_page.dart';
import 'package:teddypet_mobile/presentation/providers/auth/auth_provider.dart';
import 'package:teddypet_mobile/core/routes/app_routes.dart';
import 'package:teddypet_mobile/presentation/pages/order/order_detail_page.dart';
import 'package:teddypet_mobile/presentation/providers/cart/cart_provider.dart';
import 'package:teddypet_mobile/presentation/providers/common/navigation_provider.dart';
import 'package:teddypet_mobile/presentation/providers/notification/notification_provider.dart';

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {

  @override
  void initState() {
    super.initState();
    // Tải giỏ hàng ngay khi vào app để hiện badge
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().fetchMyCart(background: true);
      context.read<NotificationProvider>().fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final navProvider = context.watch<NavigationProvider>();
    final currentIndex = navProvider.currentIndex;

    final List<Widget> pages = [
      const HomePage(),
      const CategoryPage(), // Gắn trang danh mục vào đây
      const CartPage(), // Gắn trang giỏ hàng vào đây (index 2)
      authProvider.token != null ? const NotificationPage() : _buildLoginPrompt(),
      authProvider.token != null ? const ProfilePage() : _buildLoginPrompt(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: currentIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: (index) {
            navProvider.setTab(index);
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: Colors.grey[500],
          selectedFontSize: 12,
          unselectedFontSize: 12,
          elevation: 0,
          items: [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Trang chủ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_outlined),
              activeIcon: Icon(Icons.grid_view),
              label: 'Danh mục',
            ),
            BottomNavigationBarItem(
              icon: Consumer<CartProvider>(
                builder: (context, cartProvider, child) {
                  final count = cartProvider.cart?.totalItems ?? 0;
                  return Badge(
                    label: Text(
                      count.toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                    isLabelVisible: count > 0,
                    backgroundColor: Colors.red,
                    child: const Icon(Icons.shopping_cart_outlined),
                  );
                },
              ),
              activeIcon: Consumer<CartProvider>(
                builder: (context, cartProvider, child) {
                  final count = cartProvider.cart?.totalItems ?? 0;
                  return Badge(
                    label: Text(
                      count.toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                    isLabelVisible: count > 0,
                    backgroundColor: Colors.red,
                    child: const Icon(Icons.shopping_cart),
                  );
                },
              ),
              label: 'Giỏ hàng',
            ),
            BottomNavigationBarItem(
              icon: Consumer<NotificationProvider>(
                builder: (context, provider, child) {
                  return Badge(
                    label: Text(
                      provider.unreadCount.toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                    isLabelVisible: provider.unreadCount > 0,
                    backgroundColor: Colors.red,
                    child: const Icon(Icons.notifications_none_outlined),
                  );
                },
              ),
              activeIcon: Consumer<NotificationProvider>(
                builder: (context, provider, child) {
                  return Badge(
                    label: Text(
                      provider.unreadCount.toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                    isLabelVisible: provider.unreadCount > 0,
                    backgroundColor: Colors.red,
                    child: const Icon(Icons.notifications),
                  );
                },
              ),
              label: 'Thông báo',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Tài khoản',
            ),
          ],
        ),
      ),
      floatingActionButton: authProvider.token != null ? FloatingActionButton.extended(
        onPressed: () {
          Navigator.pushNamed(context, AppRoutes.bookingWizard);
        },
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_shopping_cart, color: Colors.white),
        label: const Text('Đặt lịch ngay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ) : null,
    );
  }

  Widget _buildLoginPrompt() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock_outline, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'Vui lòng đăng nhập\nđể xem thông tin tài khoản',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, AppRoutes.login);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondary,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            child: const Text('ĐĂNG NHẬP', style: TextStyle(color: Colors.white)),
          )
        ],
      ),
    );
  }
}
