import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/core/providers/auth_provider.dart';
import 'package:teddypet_mobile/core/routes/app_routes.dart';
import 'package:teddypet_mobile/core/utils/snackbar_utils.dart';
import 'package:teddypet_mobile/core/utils/dialog_utils.dart';
import 'package:teddypet_mobile/presentation/common/widgets/custom_text_field.dart';
import 'package:teddypet_mobile/presentation/common/widgets/primary_button.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}
class _LoginPageState extends State<LoginPage> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool rememberMe = false;

  Future<void> _handleLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      SnackBarUtils.show(
        context,
        'Vui lòng nhập đầy đủ thông tin đăng nhập!',
        isError: true,
      );
      return;
    }

    try {
      final authProvider = context.read<AuthProvider>();

      final success = await authProvider.login(
        username,
        password,
      );

      if (!mounted) return;

      if (success) {
        DialogUtils.showSuccess(
          context,
          'Đăng nhập thành công!',
          onConfirm: () {
            Navigator.pushReplacementNamed(context, AppRoutes.home);
          },
        );
      } else {

        final message = authProvider.error ?? 'Đăng nhập thất bại!';


        SnackBarUtils.show(
          context,
          message,
          isError: true,
        );
      }
    } catch (e) {
      if (mounted) {
        SnackBarUtils.show(context, 'Đã xảy ra lỗi, vui lòng thử lại sau!',
            isError: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Sử dụng loading trực tiếp từ AuthProvider
    final isLoadingFromProvider = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30.0),
          child: Column(
            children: [
              const SizedBox(height: 100),
              
              // LOGO
              Image.asset('assets/images/logo.png', height: 120),
              
              const Text(
                'TEDDY PET',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF2C3E50),
                  letterSpacing: 2,
                ),
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'Chào bạn quay trở lại!',
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              ),
              
              const SizedBox(height: 50),

              // INPUTS
              CustomTextField(
                controller: _usernameController,
                label: 'Tên đăng nhập/Email',
                placeholder: 'Nhập tên đăng nhập hoặc email',
              ),
              
              const SizedBox(height: 20),

              CustomTextField(
                controller: _passwordController,
                label: 'Mật khẩu',
                placeholder: 'Nhập mật khẩu',
                isPassword: true,
              ),

              const SizedBox(height: 10),

              // HÀNG 1: NHỚ MẬT KHẨU & QUÊN MẬT KHẨU
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Checkbox(
                        value: rememberMe,
                        onChanged: (value) {
                          setState(() {
                            rememberMe = value ?? false;
                          });
                        },
                        activeColor: const Color(0xFFE67E22),
                      ),
                      const Text(
                        'Nhớ Mật Khẩu',
                        style: TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pushReplacementNamed(context, AppRoutes.forgotPassword);
                    },
                    child: const Text(
                      'Quên mật khẩu?',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFFE67E22),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // NÚT ĐĂNG NHẬP
              PrimaryButton(
                text: 'ĐĂNG NHẬP',
                onPressed: _handleLogin,
                isLoading: isLoadingFromProvider,
              ),

              const SizedBox(height: 25),

              // CHUYỂN SANG ĐĂNG KÝ
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Bạn chưa có tài khoản? ',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  GestureDetector(
                    onTap: () {
                      // TODO: Navigate to Register
                    },
                    child: const Text(
                      'Đăng ký ngay',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFFE67E22),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 30),

              // LINE HOẶC
              Row(
                children: [
                  Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'HOẶC',
                      style: TextStyle(
                        color: Color(0xFF888888),
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
                ],
              ),

              const SizedBox(height: 25),

              // ĐĂNG NHẬP GOOGLE
              Center(
                child: InkWell(
                  onTap: () {
                    // TODO: Google Login Logic
                  },
                  borderRadius: BorderRadius.circular(30),
                  child: Container(
                    width: 50,
                    height: 50,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Image.network(
                      'https://i.imgur.com/Z8EmTcv.png',
                      fit: BoxFit.contain,
                    ),
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

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
