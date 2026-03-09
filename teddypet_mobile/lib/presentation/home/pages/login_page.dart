
import 'package:flutter/material.dart';

import '../../../core/network/auth-provider.dart';

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  void _handleLogin() async {
    final provider = Provider.of<AuthProvider>(context, listen: false);
    final success = await provider.login(_emailController.text, _passwordController.text);

    if (success) {
      Navigator.pushReplacementNamed(context, '/home'); // Về trang chủ
    } else if (provider.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error!)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("Đăng nhập 👋", style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
              SizedBox(height: 40),
              TextField(controller: _emailController, decoration: InputDecoration(labelText: "Email / Tên đăng nhập")),
              SizedBox(height: 20),
              TextField(controller: _passwordController, obscureText: true, decoration: InputDecoration(labelText: "Mật khẩu")),
              SizedBox(height: 40),
              ElevatedButton(
                onPressed: context.watch<AuthProvider>().isLoading ? null : _handleLogin,
                child: Text("ĐĂNG NHẬP"),
              )
            ],
          ),
        ),
      ),
    );
  }
}
