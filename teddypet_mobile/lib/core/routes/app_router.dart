

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:teddypet_mobile/presentation/home/pages/home_page.dart';

import 'app_routes.dart';

class AppRouter {
  static Route<dynamic> generateRoute(RouteSettings settings){

    switch(settings.name) {
      case AppRoutes.home :
        return MaterialPageRoute(
          builder: (_) => HomePage(),
        );
        default:
          return MaterialPageRoute(
              builder: (_) => Scaffold(
                body: Center(
                  child: Center(child: Text('Không tìm thấy trang {settings.name}')),
                ),
              ));
    }

  }
}