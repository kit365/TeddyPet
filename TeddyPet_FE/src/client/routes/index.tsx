import type { RouteObject } from "react-router-dom";
import { HomePage } from "../pages/home/HomePage";
import { ProductDetailPage } from "../pages/product/ProductDetail";
import { ProductListPage } from "../pages/product/ProductList";
import { BlogListPage } from "../pages/blog/BlogList";
import { RegisterPage } from "../pages/register-login/Register";
import { LoginPage } from "../pages/register-login/Login";
import { ForgotPasswordPage } from "../pages/account/ForgotPassword";
import { BookingPage } from "../pages/booking/Booking";
import { ServicePage } from "../pages/service/Service";
import { CartPage } from "../pages/cart/Cart";
import { CheckoutPage } from "../pages/checkout/Checkout";
import { CheckSuccessPage } from "../pages/checkout/CheckoutSuccess";
import { BlogDetailPage } from "../pages/blog/BlogDetail";

export const ClientRoutes: RouteObject[] = [
    { path: "/", element: <HomePage /> },
    { path: "/product/detail/:slug", element: <ProductDetailPage /> },
    { path: "/shop", element: <ProductListPage /> },
    { path: "/blogs", element: <BlogListPage /> },
    { path: "/blog/detail/:slug", element: <BlogDetailPage /> },
    { path: "/dat-lich", element: <BookingPage /> },
    { path: "/gio-hang", element: <CartPage /> },
    { path: "/thanh-toan", element: <CheckoutPage /> },
    { path: "/thanh-toan/thanh-cong", element: <CheckSuccessPage /> },
    { path: "/dich-vu", element: <ServicePage /> },
    { path: "/auth/register", element: <RegisterPage /> },
    { path: "/auth/login", element: <LoginPage /> },
    { path: "/tai-khoan/quen-mat-khau", element: <ForgotPasswordPage /> },
];
