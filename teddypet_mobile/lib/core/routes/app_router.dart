
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:teddypet_mobile/presentation/pages/auth/forgot_password.dart';
import 'package:teddypet_mobile/presentation/pages/auth/login_page.dart';
import 'package:teddypet_mobile/presentation/pages/home/home_page.dart';

import 'app_routes.dart';

class AppRouter {
  static Route<dynamic> generateRoute(RouteSettings settings){

    switch(settings.name) {
      case AppRoutes.home :
        return MaterialPageRoute(
          builder: (_) => const HomePage(),
        );
      case AppRoutes.login :
        return MaterialPageRoute(
          builder: (_) => const LoginPage(),
        );
      case AppRoutes.forgotPassword :
        return MaterialPageRoute(
            builder: (_) => const ForgotPasswordPage(),
        );
        default:
          return MaterialPageRoute(
              builder: (_) => Scaffold(
                body: Center(
                  child: Center(child: Text('Không tìm thấy trang ${settings.name}')),
                ),
              ));
    }

  }
}