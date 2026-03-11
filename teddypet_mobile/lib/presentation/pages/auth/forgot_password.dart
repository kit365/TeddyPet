import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/core/providers/auth_provider.dart';
import 'package:teddypet_mobile/presentation/common/widgets/custom_text_field.dart';
import 'package:teddypet_mobile/presentation/common/widgets/primary_button.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/utils/dialog_utils.dart';
import '../../../core/utils/snackbar_utils.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<StatefulWidget> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  int _currentStep = 0; // 0: Nhập email, 1: Nhập OTP, 2: Nhập mật khẩu mới

  Future<void> _handleStep0() async {
    final email = _emailController.text.trim();

    if (email.isEmpty) {
      SnackBarUtils.show(context, 'Vui lòng nhập email!', isError: true);
      return;
    }

    if (!RegExp(r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+").hasMatch(email)) {
      SnackBarUtils.show(context, 'Email không đúng định dạng', isError: true);
      return;
    }

    try {
      final authProvider = context.read<AuthProvider>();

      final success = await authProvider.requestOtp(email);

      if (!mounted) return;

      if (success) {
        SnackBarUtils.show(context, 'Mã OTP đã được gửi đến email của bạn!');
        setState(() => _currentStep = 1);
      } else {
        final message = authProvider.error ?? 'Yêu cầu OTP thất bại!';
        SnackBarUtils.show(context, message, isError: true);
      }
    } catch (e) {
      if (mounted) {
        SnackBarUtils.show(
          context,
          'Đã xảy ra lỗi, vui lòng thử lại sau!',
          isError: true,
        );
      }
    }
  }

  Future<void> _handleStep1() async {
    final otp = _otpController.text.trim();

    if (otp.isEmpty) {
      SnackBarUtils.show(context, 'Vui lòng nhập mã OTP!', isError: true);
      return;
    }

    if (otp.length < 6) {
      SnackBarUtils.show(context, 'Mã OTP phải có 6 chữ số!', isError: true);
      return;
    }

    try {
      final authProvider = context.read<AuthProvider>();
      final success = await authProvider.verifyOtp(otp);

      if (!mounted) return;

      if (success) {
        setState(() => _currentStep = 2);
      } else {
        SnackBarUtils.show(
          context,
          authProvider.error ?? 'Mã xác nhận không hợp lệ!',
          isError: true,
        );
      }
    } catch (e) {
      if (mounted) {
        SnackBarUtils.show(
          context,
          'Đã xảy ra lỗi, vui lòng thử lại sau!',
          isError: true,
        );
      }
    }
  }

  Future<void> _handleStep2() async {
    final newPass = _newPasswordController.text;
    final confirmPass = _confirmPasswordController.text;

    if (newPass.isEmpty || confirmPass.isEmpty) {
      SnackBarUtils.show(context, 'Vui lòng điền đầy đủ mật khẩu!', isError: true);
      return;
    }

    if (newPass.length < 6) {
      SnackBarUtils.show(context, 'Mật khẩu phải từ 6 ký tự!', isError: true);
      return;
    }

    if (newPass != confirmPass) {
      SnackBarUtils.show(context, 'Mật khẩu xác nhận không khớp!', isError: true);
      return;
    }

    try {
      final authProvider = context.read<AuthProvider>();
      final success = await authProvider.resetPassword(
        _otpController.text.trim(),
        newPass,
        confirmPass,
      );

      if (!mounted) return;

      if (success) {
        DialogUtils.showSuccess(
          context,
          'Đổi mật khẩu thành công!',
          onConfirm: () {
            Navigator.pushReplacementNamed(context, AppRoutes.login);
          },
        );
      } else {
        SnackBarUtils.show(
          context,
          authProvider.error ?? 'Đổi mật khẩu thất bại!',
          isError: true,
        );
      }
    } catch (e) {
      if (mounted) {
        SnackBarUtils.show(
          context,
          'Đã xảy ra lỗi, vui lòng thử lại sau!',
          isError: true,
        );
      }
    }
  }


  Widget _buildHeader(String title, String subtitle) {
    return Column(
      children: [
        const SizedBox(height: 40),
        Image.asset('assets/images/logo.png', height: 100),
        const SizedBox(height: 20),
        Text(
          title,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2C3E50),
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: Colors.grey[600],
              height: 1.5,
            ),
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildEmailStep() {
    return Column(
      children: [
        CustomTextField(
          controller: _emailController,
          label: 'Địa chỉ Email',
          placeholder: 'example@gmail.com',
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 30),
        PrimaryButton(
          text: 'GỬI MÃ XÁC NHẬN',
          isLoading: context.watch<AuthProvider>().isLoading,
          onPressed: _handleStep0,
        ),
      ],
    );
  }

  Widget _buildOtpStep() {
    return Column(
      children: [
        CustomTextField(
          controller: _otpController,
          label: 'Mã xác thực OTP',
          placeholder: 'Nhập mã 6 số',
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 30),
        PrimaryButton(
          text: 'XÁC THỰC',
          isLoading: context.watch<AuthProvider>().isLoading,
          onPressed: _handleStep1,
        ),
        TextButton(
          onPressed: () {
            // Logic gửi lại mã nếu muốn
          },
          child: const Text(
            'Chưa nhận được mã? Gửi lại',
            style: TextStyle(
              color: Color(0xFFE67E22),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNewPasswordStep() {
    return Column(
      children: [
        CustomTextField(
          controller: _newPasswordController,
          label: 'Mật khẩu mới',
          placeholder: 'Nhập mật khẩu mới',
          isPassword: true,
        ),
        const SizedBox(height: 16),
        CustomTextField(
          controller: _confirmPasswordController,
          label: 'Xác nhận mật khẩu',
          placeholder: 'Nhập lại mật khẩu mới',
          isPassword: true,
        ),
        const SizedBox(height: 30),
        PrimaryButton(
          text: 'ĐẶT LẠI MẬT KHẨU',
          isLoading: context.watch<AuthProvider>().isLoading,
          onPressed: _handleStep2,
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF2C3E50)),
          onPressed: () {
            if (_currentStep > 0) {
              setState(() => _currentStep--);
            } else {
              Navigator.pop(context);
            }
          },
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30.0),
          child: Column(
            children: [
              if (_currentStep == 0)
                _buildHeader(
                  'Quên mật khẩu?',
                  'Đừng lo lắng! Nhập email của bạn để lấy lại quyền truy cập.',
                ),
              if (_currentStep == 1)
                _buildHeader(
                  'Xác thực mã OTP',
                  'Chúng tôi đã gửi mã xác nhận đến Email của bạn.',
                ),
              if (_currentStep == 2)
                _buildHeader(
                  'Mật khẩu mới',
                  'Hãy tạo một mật khẩu mạnh để bảo vệ tài khoản của bạn.',
                ),

              const SizedBox(height: 10),

              switch (_currentStep) {
                0 => _buildEmailStep(),
                1 => _buildOtpStep(),
                2 => _buildNewPasswordStep(),
                _ => const SizedBox(),
              },

              const SizedBox(height: 50),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _confirmPasswordController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }
}
