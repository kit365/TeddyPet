import type { RouteObject } from "react-router-dom";
import { HomePage } from "../pages/home/HomePage";
import { ProductDetailPage } from "../pages/product/ProductDetail";
import { ProductListPage } from "../pages/product/ProductList";
import { ProductCategoryPage } from "../pages/product/ProductCategoryPage";
import { BlogListPage } from "../pages/blog/BlogList";
import { BlogDetailPage } from "../pages/blog/BlogDetail";
import { RegisterPage } from "../pages/auth/Register";
import { LoginPage } from "../pages/auth/Login";
import { BookingPage } from "../pages/booking/Booking";
import { BookingDetailPage } from "../pages/booking/BookingDetail";
import { ServicePage } from "../pages/service/Service";
import { CartPage } from "../pages/cart/Cart";
import { FeedbackPage } from "../pages/FeedbackPage";
import { CheckoutPage } from "../pages/checkout/Checkout";
import { CheckSuccessPage } from "../pages/checkout/CheckoutSuccess";
import { OrderTrackingPage } from "../pages/checkout/OrderTracking";
import { ProfilePage } from "../pages/dashboard/Profile";
import { OverviewPage } from "../pages/dashboard/Overview";
import { ProfileEditPage } from "../pages/dashboard/ProfileEdit";
import { AddressListPage } from "../pages/dashboard/AddressList";
import { AddressCreatePage } from "../pages/dashboard/AddressCreate";
import { AddressEditPage } from "../pages/dashboard/AddressEdit";
import { WishlistPage } from "../pages/dashboard/Wishlist";
import { ChangePasswordPage } from "../pages/dashboard/ChangePassword";
import { ReviewPage } from "../pages/dashboard/Review";
import { OrderDetailPage } from "../pages/dashboard/OrderDetail";
import { OrderHistoryPage } from "../pages/dashboard/OrderHistory";
import { OrderInvoicePage } from "../pages/dashboard/OrderInvoice";
import { PetsPage } from "../pages/dashboard/Pets";
import { AuthGuard } from "../components/guards/AuthGuard";

import { ForgotPasswordPage } from "../pages/auth/ForgotPassword";

import { VerifyEmailPage } from "../pages/auth/VerifyEmail";

import { ForgotPasswordSuccessPage } from "../pages/auth/ForgotPasswordSuccess";
import { RegisterSuccessPage } from "../pages/auth/RegisterSuccess";
import { ResetPasswordEntryPage } from "../pages/auth/ResetPasswordEntry";
import { ResetPasswordFormPage } from "../pages/auth/ResetPasswordForm";

export const ClientAuthRoutes: RouteObject[] = [
    { path: "/auth/register", element: <RegisterPage /> },
    { path: "/auth/register-success", element: <RegisterSuccessPage /> },
    { path: "/auth/login", element: <LoginPage /> },
    { path: "/auth/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/auth/forgot-password-success", element: <ForgotPasswordSuccessPage /> },
    { path: "/verify-email", element: <VerifyEmailPage /> },
    { path: "/reset-password", element: <ResetPasswordEntryPage /> },
    { path: "/auth/reset-password-form", element: <ResetPasswordFormPage /> },
];

export const ClientRoutes: RouteObject[] = [
    { path: "/", element: <HomePage /> },
    { path: "/product/detail/:slug", element: <ProductDetailPage /> },
    { path: "/shop", element: <ProductListPage /> },
    { path: "/bai-viet", element: <BlogListPage /> },
    { path: "/blogs", element: <BlogListPage /> },
    { path: "/blog/detail/:slug", element: <BlogDetailPage /> },
    { path: "/dat-lich", element: <BookingPage /> },
    { path: "/dat-lich/chi-tiet", element: <BookingDetailPage /> },
    { path: "/cart", element: <CartPage /> },
    { path: "/wishlist", element: <WishlistPage /> },
    { path: "/feedback", element: <FeedbackPage /> },
    { path: "/checkout", element: <CheckoutPage /> },
    { path: "/checkout/success", element: <CheckSuccessPage /> },
    { path: "/tra-cuu-don-hang", element: <OrderTrackingPage /> },
    { path: "/tracking", element: <OrderTrackingPage /> },
    { path: "/dich-vu", element: <ServicePage /> },
    { path: "/danh-muc-san-pham/:slug", element: <ProductCategoryPage /> },
    {
        path: "/dashboard",
        element: <AuthGuard />,
        children: [
            { path: "profile", element: <ProfilePage /> },
            { path: "overview", element: <OverviewPage /> },
            { path: "profile/edit", element: <ProfileEditPage /> },
            { path: "address", element: <AddressListPage /> },
            { path: "address/create", element: <AddressCreatePage /> },
            { path: "address/edit/:id", element: <AddressEditPage /> },
            { path: "change-password", element: <ChangePasswordPage /> },
            { path: "review", element: <ReviewPage /> },
            { path: "order/invoice/:id", element: <OrderInvoicePage /> },
            { path: "orders/:id", element: <OrderDetailPage /> },
            { path: "order/detail/:id", element: <OrderDetailPage /> }, // Alias
            { path: "orders", element: <OrderHistoryPage /> },
            { path: "order", element: <OrderHistoryPage /> }, // Alias
            { path: "pets", element: <PetsPage /> },
        ]
    },
];
