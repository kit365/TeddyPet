import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/presentation/providers/auth/auth_provider.dart';
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
      // Widget chỉ biết đến Provider (Lớp State)
      final authProvider = context.read<AuthProvider>();

      final success = await authProvider.login(username, password);

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
    final isLoadingFromProvider = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      appBar: AppBar(title: Text('Đăng Nhập')),
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30.0),
          child: Column(
            children: [
              const SizedBox(height: 30),
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
              PrimaryButton(
                text: 'ĐĂNG NHẬP',
                onPressed: _handleLogin,
                isLoading: isLoadingFromProvider,
              ),
              const SizedBox(height: 20),
              
              // Google UI
              const Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10),
                    child: Text('Hoặc', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  ),
                  Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 20),
              OutlinedButton(
                onPressed: () async {
                  // TODO: Implement Google Sign In SDK here
                  // Sau đó gọi: context.read<AuthProvider>().loginWithGoogle(idToken);
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                  side: const BorderSide(color: Color(0xFFDDD0D0)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.network('https://www.google.com/favicon.ico', height: 24),
                    const SizedBox(width: 10),
                    const Text(
                      'Tiếp tục với Google',
                      style: TextStyle(color: Color(0xFF2C3E50), fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 25),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Bạn chưa có tài khoản? ',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pushReplacementNamed(context, AppRoutes.register),
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
