import type { RouteObject } from "react-router-dom";
import { ProductListPage } from "../pages/product/ProductListPage";
import { ProductFormPage } from "../pages/product/ProductFormPage";
import { ProductCategoryListPage } from "../pages/product-category/ProductCategoryListPage";
import { ProductCategoryCreatePage } from "../pages/product-category/ProductCategoryCreatePage";
import { ProductCategoryEditPage } from "../pages/product-category/ProductCategoryEditPage";
import { ProductCategoryDetailPage } from "../pages/product-category/ProductCategoryDetailPage";
import { BrandListPage } from "../pages/brand/BrandListPage";
import { BrandCreatePage } from "../pages/brand/BrandCreatePage";
import { BrandEditPage } from "../pages/brand/BrandEditPage";
import { BrandDetailPage } from "../pages/brand/BrandDetailPage";
import { BlogListPage } from "../pages/blog/BlogListPage";
import { BlogCategoryListPage } from "../pages/blog-category/BlogCategoryListPage";
import { BlogCategoryCreatePage } from "../pages/blog-category/BlogCategoryCreatePage";
import { BlogCategoryEditPage } from "../pages/blog-category/BlogCategoryEditPage";
import { BlogCategoryDetailPage } from "../pages/blog-category/BlogCategoryDetailPage";
import { BlogCreatePage } from "../pages/blog/BlogCreatePage";
import { BlogDetailPage } from "../pages/blog/BlogDetailPage";
import { BlogEditPage } from "../pages/blog/BlogEditPage";
import { LoginPage } from "../pages/authen/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { ProductAttributeListPage } from "../pages/product-attribute/ProductAttributeListPage";
import { ProductAttributeCreatePage } from "../pages/product-attribute/ProductAttributeCreatePage";
import { ProductAttributeEditPage } from "../pages/product-attribute/ProductAttributeEditPage";
import { ProductAttributeDetailPage } from "../pages/product-attribute/ProductAttributeDetailPage";
import { UserListPage } from "../pages/user/UserListPage";
import { UserDetailPage } from "../pages/user/UserDetailPage";
import { OrderListPage } from "../pages/order/OrderListPage";
import { OrderDetailPage } from "../pages/order/OrderDetailPage";
import { ManualOrderPage } from "../pages/order/manual/ManualOrderPage";
import { ShippingRuleListPage } from "../pages/shipping/ShippingRuleListPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { ServiceManagementPage } from "../pages/service/ServiceManagementPage";
import { ServiceCategoryListPage } from "../pages/service/ServiceCategoryListPage";
import { ServiceCategoryCreatePage } from "../pages/service/ServiceCategoryCreatePage";
import { ServiceCategoryEditPage } from "../pages/service/ServiceCategoryEditPage";
import { ServiceCreatePage } from "../pages/service/ServiceCreatePage";
import { ServiceEditPage } from "../pages/service/ServiceEditPage";
import { ServiceComboCreatePage } from "../pages/service/ServiceComboCreatePage";
import { ServiceComboEditPage } from "../pages/service/ServiceComboEditPage";
import { BookingListPage } from "../pages/booking/BookingListPage";
import { BookingDetailPage } from "../pages/booking/BookingDetailPage";
import { BookingPetDetailPage } from "../pages/booking/BookingPetDetailPage";
import { BookingPetServiceDetailPage } from "../pages/booking/BookingPetServiceDetailPage";
import { ShopOperationHoursPage } from "../pages/shop/ShopOperationHoursPage";
import { TimeSlotExceptionListPage } from "../pages/shop/TimeSlotExceptionListPage";
import { TimeSlotExceptionFormPage } from "../pages/shop/TimeSlotExceptionFormPage";
import { RoomTypeListPage } from "../pages/room/RoomTypeListPage";
import { RoomTypeCreatePage } from "../pages/room/RoomTypeCreatePage";
import { RoomTypeEditPage } from "../pages/room/RoomTypeEditPage";
import { RoomListPage } from "../pages/room/RoomListPage";
import { RoomCreatePage } from "../pages/room/RoomCreatePage";
import { RoomEditPage } from "../pages/room/RoomEditPage";
import { RoomLayoutConfigListPage } from "../pages/room/RoomLayoutConfigListPage";
import { RoomLayoutEditorPage } from "../pages/room/RoomLayoutEditorPage";
import { AmenityListPage } from "../pages/amenity/AmenityListPage";
import { AmenityCreatePage } from "../pages/amenity/AmenityCreatePage";
import { AmenityEditPage } from "../pages/amenity/AmenityEditPage";
import { AmenityCategoryListPage } from "../pages/amenity/AmenityCategoryListPage";
import { AmenityCategoryCreatePage } from "../pages/amenity/AmenityCategoryCreatePage";
import { AmenityCategoryEditPage } from "../pages/amenity/AmenityCategoryEditPage";
import { SkillListPage } from "../pages/staff/skill/SkillListPage";
import { SkillCreatePage } from "../pages/staff/skill/SkillCreatePage";
import { SkillEditPage } from "../pages/staff/skill/SkillEditPage";
import { StaffPositionListPage } from "../pages/staff/position/StaffPositionListPage";
import { StaffPositionCreatePage } from "../pages/staff/position/StaffPositionCreatePage";
import { StaffPositionEditPage } from "../pages/staff/position/StaffPositionEditPage";
import { StaffProfileListPage } from "../pages/staff/profile/StaffProfileListPage";
import { StaffProfileOnboardingPage } from "../pages/staff/profile/StaffProfileOnboardingPage";
import { StaffProfileEditPage } from "../pages/staff/profile/StaffProfileEditPage";
import { ContractListPage } from "../pages/staff/contract/ContractListPage";
import { ContractCreatePage } from "../pages/staff/contract/ContractCreatePage";
import { ContractEditPage } from "../pages/staff/contract/ContractEditPage";
import { ContractDetailPage } from "../pages/staff/contract/ContractDetailPage";
import { WorkShiftAdminPage } from "../pages/staff/workShift/WorkShiftAdminPage";
import { WorkShiftStaffPage } from "../pages/staff/workShift/WorkShiftStaffPage";
import { OfficialSchedulePage } from "../pages/staff/workShift/OfficialSchedulePage";
import { StaffFixedSchedulePage } from "../pages/staff/fixedSchedule/StaffFixedSchedulePage";
import { RoleRouteGuard } from "../components/guards/RoleRouteGuard";
import { prefixAdmin } from "../constants/routes";
import { StaffRealtimePage } from "../pages/staff/realtime/StaffRealtimePage";
import { PayrollPage } from "../pages/staff/payroll/PayrollPage";
import { StaffSkillListPage } from "../pages/staff/staffSkill/StaffSkillListPage";
import { FeedbackListPage } from "../pages/feedback/FeedbackListPage";
import { EmployeeDashboardPage } from "../pages/staff/dashboard/EmployeeDashboardPage";

export const AdminRoutes: RouteObject[] = [
    { path: "dashboard", element: <DashboardPage /> },
    { path: "dashboard/booking", element: <BookingListPage /> },
    { path: "product/list", element: <ProductListPage /> },
    { path: "product/create", element: <ProductFormPage /> },
    { path: "product/edit/:id", element: <ProductFormPage /> },
    { path: "product/detail/:id", element: <ProductFormPage /> },
    { path: "product/attribute/list", element: <ProductAttributeListPage /> },
    { path: "product-attribute/create", element: <ProductAttributeCreatePage /> },
    { path: "product-attribute/edit/:id", element: <ProductAttributeEditPage /> },
    { path: "product-attribute/detail/:id", element: <ProductAttributeDetailPage /> },
    { path: "product-category/list", element: <ProductCategoryListPage /> },
    { path: "product-category/create", element: <ProductCategoryCreatePage /> },
    { path: "product-category/edit/:id", element: <ProductCategoryEditPage /> },
    { path: "product-category/detail/:id", element: <ProductCategoryDetailPage /> },
    { path: "brand/list", element: <BrandListPage /> },
    { path: "brand/create", element: <BrandCreatePage /> },
    { path: "brand/edit/:id", element: <BrandEditPage /> },
    { path: "brand/detail/:id", element: <BrandDetailPage /> },
    { path: "blog/list", element: <BlogListPage /> },
    { path: "blog/create", element: <BlogCreatePage /> },
    { path: "blog/edit/:id", element: <BlogEditPage /> },
    { path: "blog/detail/:id", element: <BlogDetailPage /> },
    { path: "blog-category/list", element: <BlogCategoryListPage /> },
    { path: "blog-category/create", element: <BlogCategoryCreatePage /> },
    { path: "blog-category/edit/:id", element: <BlogCategoryEditPage /> },
    { path: "blog-category/detail/:id", element: <BlogCategoryDetailPage /> },
    { path: "user/list", element: <UserListPage /> },
    { path: "user/detail/:id", element: <UserDetailPage /> },
    { path: "order/list", element: <OrderListPage /> },
    { path: "order/detail/:id", element: <OrderDetailPage /> },
    { path: "order/manual", element: <ManualOrderPage /> },
    { path: "feedback/list", element: <FeedbackListPage /> },
    { path: "booking/list", element: <BookingListPage /> },
    { path: "booking/detail/:id", element: <BookingDetailPage /> },
    { path: "booking/detail/:id/pet/:petId", element: <BookingPetDetailPage /> },
    { path: "booking/detail/:id/pet/:petId/service/:serviceId", element: <BookingPetServiceDetailPage /> },
    { path: "shipping/list", element: <ShippingRuleListPage /> },
    { path: "settings", element: <SettingsPage /> },
    { path: "service/list", element: <ServiceManagementPage /> },
    { path: "service/create", element: <ServiceCreatePage /> },
    { path: "service/edit/:id", element: <ServiceEditPage /> },
    { path: "service-combo/create", element: <ServiceComboCreatePage /> },
    { path: "service-combo/edit/:id", element: <ServiceComboEditPage /> },
    { path: "service-category/list", element: <ServiceCategoryListPage /> },
    { path: "service-category/create", element: <ServiceCategoryCreatePage /> },
    { path: "service-category/edit/:id", element: <ServiceCategoryEditPage /> },
    { path: "shop-operation-hours", element: <ShopOperationHoursPage /> },
    { path: "time-slot-exception/list", element: <TimeSlotExceptionListPage /> },
    { path: "time-slot-exception/create", element: <TimeSlotExceptionFormPage /> },
    { path: "time-slot-exception/edit/:id", element: <TimeSlotExceptionFormPage /> },
    { path: "room-type/list", element: <RoomTypeListPage /> },
    { path: "room-type/create", element: <RoomTypeCreatePage /> },
    { path: "room-type/edit/:id", element: <RoomTypeEditPage /> },
    { path: "room/list", element: <RoomListPage /> },
    { path: "room/create", element: <RoomCreatePage /> },
    { path: "room/edit/:id", element: <RoomEditPage /> },
    { path: "room-layout-config/list", element: <RoomLayoutConfigListPage /> },
    { path: "room-layout-config/editor/:id", element: <RoomLayoutEditorPage /> },
    { path: "amenity/list", element: <AmenityListPage /> },
    { path: "amenity/create", element: <AmenityCreatePage /> },
    { path: "amenity/edit/:id", element: <AmenityEditPage /> },
    { path: "amenity-category/list", element: <AmenityCategoryListPage /> },
    { path: "amenity-category/create", element: <AmenityCategoryCreatePage /> },
    { path: "amenity-category/edit/:id", element: <AmenityCategoryEditPage /> },
    { path: "staff/profile/list", element: <StaffProfileListPage /> },
    { path: "staff/profile/onboarding", element: <StaffProfileOnboardingPage /> },
    { path: "staff/profile/edit/:id", element: <StaffProfileEditPage /> },
    { path: "staff/position/list", element: <StaffPositionListPage /> },
    { path: "staff/position/create", element: <StaffPositionCreatePage /> },
    { path: "staff/position/edit/:id", element: <StaffPositionEditPage /> },
    { path: "staff/skill/list", element: <SkillListPage /> },
    { path: "staff/skill/create", element: <SkillCreatePage /> },
    { path: "staff/skill/edit/:id", element: <SkillEditPage /> },
    { path: "staff/skills-map/list", element: <StaffSkillListPage /> },
    { path: "staff/contract/list", element: <ContractListPage /> },
    { path: "staff/contract/create", element: <ContractCreatePage /> },
    { path: "staff/contract/edit/:id", element: <ContractEditPage /> },
    { path: "staff/contract/detail/:id", element: <ContractDetailPage /> },
    { path: "staff/fixed-schedules", element: <StaffFixedSchedulePage /> },
    { path: "staff/official-schedule", element: <OfficialSchedulePage /> },
    {
        path: "staff/work-shifts",
        element: (
            <RoleRouteGuard allowedRoles={["ADMIN"]} redirectTo={`/${prefixAdmin}/staff/work-shifts/register`}>
                <WorkShiftAdminPage />
            </RoleRouteGuard>
        ),
    },
    {
        path: "staff/work-shifts/register",
        element: (
            <RoleRouteGuard allowedRoles={["STAFF"]} redirectTo={`/${prefixAdmin}/staff/work-shifts`}>
                <WorkShiftStaffPage />
            </RoleRouteGuard>
        ),
    },
    { path: "staff/realtime", element: <StaffRealtimePage /> },
    { path: "staff/payroll", element: <PayrollPage /> },
    {
        path: "staff/dashboard",
        element: (
            <RoleRouteGuard allowedRoles={["STAFF"]} redirectTo={`/${prefixAdmin}/staff/profile/list`}>
                <EmployeeDashboardPage />
            </RoleRouteGuard>
        ),
    },
];

export const AdminAuthRoutes: RouteObject[] = [
    { path: "auth/login", element: <LoginPage /> },
];
