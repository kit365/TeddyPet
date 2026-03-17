import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/presentation/providers/auth/auth_provider.dart';
import 'package:teddypet_mobile/presentation/providers/user/user_provider.dart';
import 'package:teddypet_mobile/presentation/providers/user/user_address_provider.dart';
import 'package:teddypet_mobile/presentation/providers/category/category_provider.dart';
import 'package:teddypet_mobile/data/repositories/category/category_repository_impl.dart';
import 'package:teddypet_mobile/application/category/category_app_service_impl.dart';
import 'package:teddypet_mobile/presentation/controllers/category/category_controller.dart';
import 'package:teddypet_mobile/presentation/providers/product/product_list_provider.dart';
import 'package:teddypet_mobile/presentation/providers/product/product_detail_provider.dart';
import 'package:teddypet_mobile/presentation/providers/product/product_reviews_provider.dart';
import 'package:teddypet_mobile/data/repositories/product/product_repository_impl.dart';
import 'package:teddypet_mobile/application/product/product_app_service_impl.dart';
import 'package:teddypet_mobile/presentation/controllers/product/product_controller.dart';
import 'package:teddypet_mobile/presentation/providers/common/filter_provider.dart';
import 'package:teddypet_mobile/presentation/providers/common/navigation_provider.dart';
import 'package:teddypet_mobile/data/repositories/brand/brand_repository.dart';
import 'package:teddypet_mobile/presentation/providers/cart/cart_provider.dart';
import 'package:teddypet_mobile/data/repositories/cart/cart_repository_impl.dart';
import 'package:teddypet_mobile/application/cart/cart_app_service_impl.dart';
import 'package:teddypet_mobile/presentation/controllers/cart/cart_controller.dart';
import 'package:teddypet_mobile/presentation/providers/order/order_provider.dart';
import 'package:teddypet_mobile/data/repositories/order/order_repository_impl.dart';
import 'package:teddypet_mobile/application/order/order_app_service_impl.dart';
import 'package:teddypet_mobile/presentation/controllers/order/order_controller.dart';
import 'package:teddypet_mobile/presentation/providers/wishlist/wishlist_provider.dart';
import 'package:teddypet_mobile/data/repositories/wishlist/wishlist_repository.dart';
import 'package:teddypet_mobile/application/wishlist/wishlist_app_service.dart';
import 'package:teddypet_mobile/presentation/controllers/wishlist/wishlist_controller.dart';
import 'package:teddypet_mobile/data/repositories/feedback/feedback_repository_impl.dart';
import 'package:teddypet_mobile/application/feedback/feedback_app_service.dart';
import 'package:teddypet_mobile/presentation/controllers/feedback/feedback_controller.dart';
import 'package:teddypet_mobile/presentation/providers/feedback/feedback_provider.dart';
import 'package:teddypet_mobile/core/network/api_client.dart';
import 'package:teddypet_mobile/data/api/wishlist.api.dart';
import 'package:teddypet_mobile/core/routes/app_routes.dart';
import 'core/routes/app_router.dart';
import 'package:teddypet_mobile/presentation/providers/home/home_provider.dart';

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
        ChangeNotifierProvider(create: (_) => NavigationProvider()),
        ChangeNotifierProvider(
          create: (_) => CategoryProvider(
            CategoryController(
              CategoryAppServiceImpl(CategoryRepositoryImpl()),
            ),
          ),
        ),
        Provider(
          create: (_) => ProductController(
            ProductAppServiceImpl(ProductRepositoryImpl()),
          ),
        ),
        ChangeNotifierProvider(
          create: (context) => ProductListProvider(context.read<ProductController>()),
        ),
        ChangeNotifierProvider(
          create: (context) => ProductDetailProvider(context.read<ProductController>()),
        ),
        ChangeNotifierProvider(
          create: (context) => ProductReviewsProvider(context.read<ProductController>()),
        ),
        ChangeNotifierProvider(
          create: (context) => FilterProvider(BrandRepositoryImpl()),
        ),
        ChangeNotifierProvider(
          create: (_) => CartProvider(
            CartController(
              CartAppServiceImpl(CartRepositoryImpl()),
            ),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => OrderProvider(
            OrderController(
              OrderAppServiceImpl(OrderRepositoryImpl()),
            ),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => WishlistProvider(
            WishlistControllerImpl(
              WishlistAppServiceImpl(
                WishlistRepositoryImpl(WishlistApi(ApiClient())),
              ),
            ),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => FeedbackProvider(
            FeedbackController(
              FeedbackAppServiceImpl(FeedbackRepositoryImpl()),
            ),
          ),
        ),
        ChangeNotifierProvider(
          create: (context) => HomeProvider(
            context.read<ProductController>(),
            CategoryController(
              CategoryAppServiceImpl(CategoryRepositoryImpl()),
            ),
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
