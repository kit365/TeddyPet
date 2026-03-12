import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/presentation/providers/auth/auth_provider.dart';
import 'package:teddypet_mobile/presentation/providers/user/user_provider.dart';
import 'package:teddypet_mobile/presentation/providers/user/user_address_provider.dart';
import 'package:teddypet_mobile/presentation/providers/category/category_provider.dart';
import 'package:teddypet_mobile/data/repositories/category/category_repository_impl.dart';
import 'package:teddypet_mobile/application/category/category_app_service_impl.dart';
import 'package:teddypet_mobile/presentation/providers/cart/cart_provider.dart';
import 'package:teddypet_mobile/data/repositories/cart/cart_repository_impl.dart';
import 'package:teddypet_mobile/application/cart/cart_app_service_impl.dart';
import 'package:teddypet_mobile/presentation/providers/order/order_provider.dart';
import 'package:teddypet_mobile/data/repositories/order/order_repository_impl.dart';
import 'package:teddypet_mobile/application/order/order_service_impl.dart';
import 'package:teddypet_mobile/core/routes/app_routes.dart';
import 'core/routes/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load file .env
  await dotenv.load(fileName: ".env");
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => UserAddressProvider()),
        ChangeNotifierProvider(
          create: (_) => CategoryProvider(
            CategoryAppServiceImpl(CategoryRepositoryImpl()),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => CartProvider(
            CartAppServiceImpl(CartRepositoryImpl()),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => OrderProvider(
            OrderServiceImpl(OrderRepositoryImpl()),
          ),
        ),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TeddyPet Mobile',
      debugShowCheckedModeBanner: false,
      initialRoute: AppRoutes.home,
      onGenerateRoute: AppRouter.generateRoute,
    );
  }
}
