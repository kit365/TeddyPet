import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/routes/app_routes.dart';
import '../../common/widgets/custom_text_field.dart';
import '../../common/widgets/primary_button.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _loginController = TextEditingController();
  final _passwordController = TextEditingController();

  Future<void> _handleLogin() async {
    final email = _loginController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập đầy đủ thông tin!')),
      );
      return;
    }

    final success = await context.read<AuthProvider>().login(email, password);

    if (!mounted) return;

    if (success) {
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } else {
      final error = context.read<AuthProvider>().error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Đăng nhập thất bại!'),
          backgroundColor: const Color(0xFFC0392B),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isLoading = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30.0),
          child: Column(
            children: [
              const SizedBox(height: 100),
              // LOGO & HEADER
              Column(
                children: [
                  const Icon(
                    Icons.pets,
                    size: 80,
                    color: Color(0xFFE67E22),
                  ),
                  const SizedBox(height: 16),
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
                    'Chào bạn quay trở lại! 👋',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 60),

              // FORM FIELDS
              CustomTextField(
                controller: _loginController,
                label: 'Tên đăng nhập / Email',
                placeholder: 'Nhập tên đăng nhập hoặc email',
              ),
              const SizedBox(height: 24),
              CustomTextField(
                controller: _passwordController,
                label: 'Mật khẩu',
                placeholder: 'Nhập mật khẩu của bạn',
                isPassword: true,
              ),

              // FORGOT PASSWORD (OPTIONAL)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    // Chức năng quên mật khẩu chưa làm
                  },
                  child: const Text(
                    'Quên mật khẩu?',
                    style: TextStyle(
                      color: Color(0xFFE67E22),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // LOGIN BUTTON
              PrimaryButton(
                text: 'ĐĂNG NHẬP',
                onPressed: _handleLogin,
                isLoading: isLoading,
              ),

              const SizedBox(height: 48),

              // DON'T HAVE AN ACCOUNT?
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Bạn chưa có tài khoản? ',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  GestureDetector(
                    onTap: () {
                      // Chuyển sang trang đăng ký (nếu có)
                    },
                    child: const Text(
                      'Đăng ký ngay',
                      style: TextStyle(
                        color: Color(0xFFE67E22),
                        fontWeight: FontWeight.bold,
                        decoration: TextDecoration.underline,
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
    _loginController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
