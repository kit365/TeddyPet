import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/core/routes/app_routes.dart';
import 'package:teddypet_mobile/core/utils/snackbar_utils.dart';
import 'package:teddypet_mobile/core/utils/dialog_utils.dart';
import 'package:teddypet_mobile/presentation/common/widgets/custom_text_field.dart';
import 'package:teddypet_mobile/presentation/common/widgets/primary_button.dart';
import 'package:teddypet_mobile/presentation/providers/auth/auth_provider.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  // 1. Controller
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _otpController = TextEditingController();

  // 2. Step management
  int _step = 0; // 0: Form, 1: OTP

  // 3. Logic: Gửi Form Đăng Ký
  Future<void> _handleRegister() async {
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final username = _usernameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;

    // Logic validation giúp anh
    if (firstName.isEmpty || lastName.isEmpty || username.isEmpty || email.isEmpty || password.isEmpty) {
      SnackBarUtils.show(context, 'Vui lòng điền đầy đủ thông tin!', isError: true);
      return;
    }

    if (password != confirm) {
      SnackBarUtils.show(context, 'Mật khẩu xác nhận không khớp!', isError: true);
      return;
    }

    if (password.length < 6) {
      SnackBarUtils.show(context, 'Mật khẩu phải có ít nhất 6 ký tự!', isError: true);
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.register(
      username,
      email,
      password,
      firstName,
      lastName,
      _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      SnackBarUtils.show(context, 'Mã OTP đã được gửi đến email của bạn!');
      setState(() => _step = 1);
    } else {
      SnackBarUtils.show(
        context,
        authProvider.error ?? 'Đăng ký thất bại, vui lòng kiểm tra lại!',
        isError: true,
      );
    }
  }

  // 4. Logic: Xác thực OTP
  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      SnackBarUtils.show(context, 'Vui lòng nhập mã OTP 6 số!', isError: true);
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final email = authProvider.registerEmail ?? _emailController.text.trim();

    final success = await authProvider.verifyRegisterOtp(email, otp);

    if (!mounted) return;

    if (success) {
      DialogUtils.showSuccess(
        context,
        'Thành công! Chào mừng bạn đến với TeddyPet!',
        onConfirm: () => Navigator.pushReplacementNamed(context, AppRoutes.home),
      );
    } else {
      SnackBarUtils.show(
        context,
        authProvider.error ?? 'Mã OTP không hợp lệ!',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      appBar: AppBar(
        title: Text(_step == 0 ? 'Đăng ký' : 'Xác thực OTP'),
        leading: _step == 1 
            ? IconButton(
                icon: const Icon(Icons.arrow_back), 
                onPressed: () => setState(() => _step = 0),
              ) 
            : null,
      ),
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30.0),
          child: Column(
            children: [
              const SizedBox(height: 20),
              Image.asset('assets/images/logo.png', height: 100),
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
                _step == 0 ? 'Tạo tài khoản mới' : 'Xác thực email',
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              ),
              const SizedBox(height: 30),
              
              if (_step == 0) _buildRegisterForm() else _buildOtpForm(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRegisterForm() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: CustomTextField(
                controller: _firstNameController,
                label: 'Họ',
                placeholder: 'Họ',
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: CustomTextField(
                controller: _lastNameController,
                label: 'Tên',
                placeholder: 'Tên',
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        CustomTextField(
          controller: _usernameController,
          label: 'Tên tài khoản',
          placeholder: 'Tên tài khoản',
        ),
        const SizedBox(height: 20),
        CustomTextField(
          controller: _emailController,
          label: 'Email',
          placeholder: 'example@gmail.com',
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 20),
        CustomTextField(
          controller: _phoneController,
          label: 'Số điện thoại',
          placeholder: 'Số điện thoại',
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: CustomTextField(
                controller: _passwordController,
                label: 'Mật khẩu',
                placeholder: 'Mật khẩu',
                isPassword: true,
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: CustomTextField(
                controller: _confirmPasswordController,
                label: 'Xác nhận',
                placeholder: 'Xác nhận',
                isPassword: true,
              ),
            ),
          ],
        ),
        const SizedBox(height: 30),
        PrimaryButton(
          text: 'ĐĂNG KÝ',
          onPressed: _handleRegister,
          isLoading: context.watch<AuthProvider>().isLoading,
        ),
        const SizedBox(height: 20),
        const Row(
          children: [
            Expanded(child: Divider()),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: Text('Hoặc', style: TextStyle(color: Colors.grey)),
            ),
            Expanded(child: Divider()),
          ],
        ),
        const SizedBox(height: 20),
        OutlinedButton(
          onPressed: () {
            // TODO: Google Sign In
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
                'Đăng ký với Google',
                style: TextStyle(color: Color(0xFF2C3E50), fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        const SizedBox(height: 25),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Bạn đã có tài khoản? ', style: TextStyle(color: Colors.grey)),
            GestureDetector(
              onTap: () => Navigator.pushReplacementNamed(context, AppRoutes.login),
              child: const Text(
                'Đăng nhập ngay',
                style: TextStyle(color: Color(0xFFE67E22), fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        const SizedBox(height: 30),
      ],
    );
  }

  Widget _buildOtpForm() {
    return Column(
      children: [
        const SizedBox(height: 30),
        
        // Thông báo email đã gửi (Vibe TeddyPet)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF3E0),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE67E22).withOpacity(0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.mark_email_read_outlined, color: Color(0xFFE67E22), size: 28),
              const SizedBox(width: 15),
              Expanded(
                child: RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 14, color: Color(0xFF2C3E50), height: 1.5),
                    children: [
                      const TextSpan(text: 'Chào bạn, chúng mình đã gửi mã xác thực đến email:\n'),
                      TextSpan(
                        text: _emailController.text,
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFE67E22)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 40),
        
        CustomTextField(
          controller: _otpController,
          label: 'Mã xác thực OTP',
          placeholder: 'Nhập mã 6 chữ số',
          keyboardType: TextInputType.number,
        ),
        
        const SizedBox(height: 40),
        
        PrimaryButton(
          text: 'XÁC THỰC TÀI KHOẢN',
          onPressed: _handleVerifyOtp,
          isLoading: context.watch<AuthProvider>().isLoading,
        ),
        
        const SizedBox(height: 20),
        
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Chưa nhận được mã? ', style: TextStyle(color: Colors.grey)),
            GestureDetector(
              onTap: () {
                _otpController.clear();
                _handleRegister(); // Gửi lại form để lấy mã mới
              },
              child: const Text(
                'Gửi lại ngay',
                style: TextStyle(
                  color: Color(0xFFE67E22),
                  fontWeight: FontWeight.bold,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 50),
      ],
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _otpController.dispose();
    super.dispose();
  }
}
