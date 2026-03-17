import 'package:flutter/material.dart';
import 'package:teddypet_mobile/presentation/pages/auth/forgot_password.dart';
import 'package:teddypet_mobile/presentation/pages/auth/login_page.dart';
import 'package:teddypet_mobile/presentation/pages/auth/register_page.dart';
import 'package:teddypet_mobile/presentation/pages/auth/change_password_page.dart';
import 'package:teddypet_mobile/presentation/pages/profile/profile_page.dart';
import 'package:teddypet_mobile/presentation/pages/profile/edit_profile_page.dart';
import 'package:teddypet_mobile/presentation/pages/profile/address_list_page.dart';
import 'package:teddypet_mobile/presentation/pages/profile/add_edit_address_page.dart';
import 'package:teddypet_mobile/presentation/pages/profile/account_settings_page.dart';
import 'package:teddypet_mobile/presentation/pages/main/main_page.dart';
import 'package:teddypet_mobile/data/models/response/user/user_address_response.dart';
import 'package:teddypet_mobile/presentation/pages/cart/cart_page.dart';
import 'package:teddypet_mobile/presentation/pages/cart/checkout_page.dart';
import 'package:teddypet_mobile/presentation/pages/cart/payment_method_page.dart';
import 'package:teddypet_mobile/presentation/pages/cart/order_success_page.dart';
import 'package:teddypet_mobile/presentation/pages/order/my_purchases_page.dart';
import 'package:teddypet_mobile/presentation/pages/order/order_detail_page.dart';
import 'package:teddypet_mobile/presentation/pages/product/product_detail_page.dart';
import 'package:teddypet_mobile/presentation/pages/product/product_reviews_page.dart';
import 'package:teddypet_mobile/presentation/pages/wishlist/wishlist_page.dart';
import 'package:teddypet_mobile/data/models/entities/order/order_entity.dart';
import 'package:teddypet_mobile/presentation/pages/product/models/product_reviews_arguments.dart';
import 'package:teddypet_mobile/presentation/pages/order/models/order_review_arguments.dart';
import 'package:teddypet_mobile/presentation/pages/order/order_review_page.dart';

import 'app_routes.dart';

class AppRouter {
  static Route<dynamic> generateRoute(RouteSettings settings){

    switch(settings.name) {
      case AppRoutes.home :
        return MaterialPageRoute(
          builder: (_) => const MainPage(), 
        );
      case AppRoutes.login :
        return MaterialPageRoute(
          builder: (_) => const LoginPage(),
        );
      case AppRoutes.forgotPassword :
        return MaterialPageRoute(
          builder: (_) => const ForgotPasswordPage(),
        );
      case AppRoutes.register :
        return MaterialPageRoute(
          builder: (_) => const RegisterPage(),
        );
      case AppRoutes.profile :
        return MaterialPageRoute(
          builder: (_) => const ProfilePage(),
        );
      case AppRoutes.editProfile:
        return MaterialPageRoute(
          builder: (_) => const EditProfilePage(),
        );
      case AppRoutes.accountSettings:
        return MaterialPageRoute(
          builder: (_) => const AccountSettingsPage(),
        );
      case AppRoutes.changePassword:
        return MaterialPageRoute(
          builder: (_) => const ChangePasswordPage(),
        );
      case AppRoutes.addressList:
        return MaterialPageRoute(
          builder: (_) => const AddressListPage(),
        );
      case AppRoutes.addEditAddress:
        final address = settings.arguments as UserAddressResponse?;
        return MaterialPageRoute(
          builder: (_) => AddEditAddressPage(address: address),
        );
      case AppRoutes.checkout:
        return MaterialPageRoute(
          builder: (_) => const CheckoutPage(),
        );
      case AppRoutes.paymentMethod:
        final initialMethod = settings.arguments as String? ?? 'CASH';
        return MaterialPageRoute(
          builder: (_) => PaymentMethodPage(initialMethod: initialMethod),
        );
      case AppRoutes.orderSuccess:
        final order = settings.arguments as OrderEntity;
        return MaterialPageRoute(
          builder: (_) => OrderSuccessPage(order: order),
        );
      case AppRoutes.myPurchases:
        return MaterialPageRoute(
          builder: (_) => const MyPurchasesPage(),
        );
      case AppRoutes.orderDetail:
        // Hỗ trợ cả OrderEntity và orderId (String)
        final args = settings.arguments;
        if (args is OrderEntity) {
          return MaterialPageRoute(
            builder: (_) => OrderDetailPage(order: args),
          );
        } else if (args is String) {
          return MaterialPageRoute(
            builder: (_) => OrderDetailPage(orderId: args),
          );
        }
        return MaterialPageRoute(
          builder: (_) => const OrderDetailPage(),
        );
      case AppRoutes.wishlist:
        return MaterialPageRoute(
          builder: (_) => const WishlistPage(),
        );
      case AppRoutes.cart:
        return MaterialPageRoute(
          builder: (_) => const CartPage(),
        );
      case AppRoutes.productDetail:
        final args = settings.arguments;
        if (args is String) {
          return MaterialPageRoute(
            builder: (_) => ProductDetailPage(slug: args),
          );
        } else if (args is int) {
          return MaterialPageRoute(
            builder: (_) => ProductDetailPage(productId: args),
          );
        }
        return MaterialPageRoute(
          builder: (_) => const ProductDetailPage(),
        );
      case AppRoutes.productReviews:
        final args = settings.arguments as ProductReviewsArguments;
        return MaterialPageRoute(
          builder: (_) => ProductReviewsPage(args: args),
        );
      case AppRoutes.orderReview:
        final args = settings.arguments as OrderReviewArguments;
        return MaterialPageRoute(
          builder: (_) => OrderReviewPage(args: args),
        );
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Center(child: Text('Không tìm thấy trang \${settings.name}')),
            ),
          )
        );
    }

  }
}