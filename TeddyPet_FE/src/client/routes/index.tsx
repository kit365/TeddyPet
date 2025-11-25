import type { RouteObject } from "react-router-dom";
import { HomePage } from "../pages/home/HomePage";
import { ProductDetailPage } from "../pages/product/ProductDetail";
import { ProductListPage } from "../pages/product/ProductList";
import { BlogListPage } from "../pages/blog/BlogList";
import { RegisterPage } from "../pages/register-login/Register";
import { ForgotPasswordPage } from "../pages/account/ForgotPassword";
import { BookingPage } from "../pages/booking/Booking";
import { ServicePage } from "../pages/service/Service";
import { CartPage } from "../pages/cart/Cart";
import { CheckoutPage } from "../pages/checkout/Checkout";
import { CheckSuccessPage } from "../pages/checkout/CheckoutSuccess";

export const ClientRoutes: RouteObject[] = [
    { path: "/", element: <HomePage /> },
    { path: "/san-pham/:slug", element: <ProductDetailPage /> },
    { path: "/cua-hang", element: <ProductListPage /> },
    { path: "/bai-viet", element: <BlogListPage /> },
    { path: "/dat-lich", element: <BookingPage /> },
    { path: "/gio-hang", element: <CartPage /> },
    { path: "/thanh-toan", element: <CheckoutPage /> },
    { path: "/thanh-toan/thanh-cong", element: <CheckSuccessPage /> },
    { path: "/dich-vu", element: <ServicePage /> },
    { path: "/dang-ky", element: <RegisterPage /> },
    { path: "/tai-khoan/quen-mat-khau", element: <ForgotPasswordPage /> },
];
