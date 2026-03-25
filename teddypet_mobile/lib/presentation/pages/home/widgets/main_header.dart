import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../../../providers/auth/auth_provider.dart';

class MainHeader extends StatefulWidget implements PreferredSizeWidget {
  const MainHeader({super.key});

  @override
  State<MainHeader> createState() => _MainHeaderState();

  @override
  Size get preferredSize => const Size.fromHeight(84);
}

class _MainHeaderState extends State<MainHeader> {
  String? _currentAddress;
  bool _isLoadingLocation = false;

  Future<void> _handleLocationTap() async {
    final locationService = LocationService();

    setState(() {
      _isLoadingLocation = true;
    });

    final location = await locationService.getLocationString();
    
    if (!mounted) return;

    setState(() {
      _isLoadingLocation = false;
      if (location != null) {
        _currentAddress = location;
      }
    });

    if (location == null) {
      SnackBarUtils.show(
        context,
        'Không thể lấy vị trí. Vui lòng bật GPS và cấp quyền vị trí.',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              // 1. Logo
              Image.network(
                'https://i.imgur.com/V2kwkkK.png',
                height: 28,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Icon(Icons.pets, color: AppColors.primary, size: 28),
              ),
              const SizedBox(width: 12),

              // 2. Search bar
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_currentAddress != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4, left: 2),
                        child: Row(
                          children: [
                            const Icon(Icons.location_on, color: AppColors.primary, size: 12),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                _currentAddress!,
                                style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.bold),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    Container(
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F3F5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: const Row(
                        children: [
                          Icon(Icons.search, color: Colors.grey, size: 18),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              "Tìm kiếm",
                              style: TextStyle(color: Colors.grey, fontSize: 13),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),

              // 3. Icons
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () {
                      if (authProvider.token == null) {
                        Navigator.pushNamed(context, AppRoutes.login);
                        return;
                      }
                      Navigator.pushNamed(context, AppRoutes.wishlist);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      color: Colors.transparent,
                      child: const Icon(Icons.favorite_border, color: AppColors.secondary, size: 24),
                    ),
                  ),
                  GestureDetector(
                    onTap: _handleLocationTap,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      color: Colors.transparent,
                      child: _isLoadingLocation
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            )
                          : const Icon(Icons.location_on_outlined, color: AppColors.secondary, size: 24),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      padding: const EdgeInsets.only(left: 6, right: 0, top: 4, bottom: 4),
                      color: Colors.transparent,
                      child: const Icon(Icons.inventory_2_outlined, color: AppColors.secondary, size: 24),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
